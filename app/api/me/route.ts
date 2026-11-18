import { NextResponse, type NextRequest } from "next/server";
import { unstable_cache } from "next/cache";
import { BADGE_TAG, CHECK_COOKIE, SESSION_CHECK_SECONDS, SESSION_COOKIE, SESSION_DAYS, cookieBase, hubCall, readSession, signSession, ssoEnabled } from "@/lib/sso";

type Badge = { level: string; verified: boolean; counted: number; categories: Record<string, number>; memberSince: string | null };

/**
 * The member's FLAME PH badge (consent 3), from flameph.org, which checks every rule and sends only the allowed fields.
 * Kept at most 5 minutes here, and dropped at once when flameph.org sends a notice.
 */
const badgeFor = (sub: string) => unstable_cache(async (): Promise<Badge | null> => {
  const res = await hubCall<{ badges?: ({ sub: string; shown: boolean } & Partial<Badge>)[] }>("/api/ecosystem/badges", "badges", { subs: [sub] });
  const b = res?.badges?.find((x) => x.sub === sub);
  return b?.shown && b.level ? { level: b.level, verified: !!b.verified, counted: b.counted ?? 0, categories: b.categories ?? {}, memberSince: b.memberSince ?? null } : null;
}, ["flame-badge", sub], { revalidate: 300, tags: [BADGE_TAG] })();

/**
 * Who is signed in, for the site's scripts. `check` asks the page to look the visitor up on flameph.org once.
 * Every 5 minutes the session is re-checked with flameph.org (logout everywhere); if it ended, the member is signed out.
 */
export async function GET(req: NextRequest) {
  let session = readSession(req.cookies.get(SESSION_COOKIE)?.value);
  const enabled = ssoEnabled();
  const now = Math.floor(Date.now() / 1000);
  let refresh: string | null = null;
  let ended = false;
  if (session && now - session.chk > SESSION_CHECK_SECONDS) {
    const status = await hubCall<{ active?: boolean }>("/api/sso/status", "sso-status", { sub: session.sub, since: session.since });
    if (status?.active === false) { session = null; ended = true; }
    else if (status?.active) refresh = signSession({ ...session, chk: now }, session.exp);
    // flameph.org unreachable: keep the session and try again on the next page.
  }
  const badge = session ? await badgeFor(session.sub).catch(() => null) : null;
  const member = session ? { email: session.email, name: session.name, badge } : null;
  const check = enabled && !member && !ended && !req.cookies.has(CHECK_COOKIE) && req.nextUrl.hostname.endsWith("negosyodepot.com");
  const res = NextResponse.json({ enabled, signedIn: !!member, member, check }, { headers: { "Cache-Control": "no-store" } });
  if (ended) {
    res.cookies.set(SESSION_COOKIE, "", { ...cookieBase, maxAge: 0 });
    res.cookies.set(CHECK_COOKIE, "off", { ...cookieBase, maxAge: 60 * 60 * 24 * 30 });
  } else if (refresh && session) {
    res.cookies.set(SESSION_COOKIE, refresh, { ...cookieBase, maxAge: Math.max(60, Math.min(session.exp - now, SESSION_DAYS * 86400)) });
  }
  return res;
}

export const dynamic = "force-dynamic";
