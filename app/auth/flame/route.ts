import { NextResponse, type NextRequest } from "next/server";
import { AUTH_COOKIE, SESSION_COOKIE, SESSION_DAYS, backTo, checkState, cookieBase, hubCall, nonceMatches, signSession } from "@/lib/sso";

type Who = { sub: string; email: string; name: string | null; nonce: string; iat: number };

/**
 * flameph.org sends visitors back here with a one-time ticket and the `state` this browser started with (or
 * error=login_required / sso_off). The ticket is swapped server-to-server; the nonce flameph.org hands back must match
 * this browser's cookie, so a ticket from a link someone sent can never sign this visitor in.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const bound = checkState(req.cookies.get(AUTH_COOKIE)?.value, sp.get("state"));
  const code = sp.get("code");
  const who = bound && code ? await hubCall<Who>("/api/sso/token", "sso-token", { code }) : null;
  const ok = !!(who?.email && who.sub && bound && nonceMatches(bound.nonce, who.nonce));
  const now = Math.floor(Date.now() / 1000);
  const session = ok ? signSession({ email: who!.email, name: who!.name ?? undefined, sub: who!.sub, since: now, chk: now }) : null;

  const res = NextResponse.redirect(backTo(sp.get("next"), req.nextUrl.origin), { headers: { "Referrer-Policy": "no-referrer", "Cache-Control": "no-store" } });
  res.cookies.set(AUTH_COOKIE, "", { ...cookieBase, maxAge: 0 });
  if (session) res.cookies.set(SESSION_COOKIE, session, { ...cookieBase, maxAge: SESSION_DAYS * 86400 });
  else if (code) console.error("auth/flame: ticket refused");
  return res;
}

export const dynamic = "force-dynamic";
