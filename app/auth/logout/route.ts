import { NextResponse, type NextRequest } from "next/server";
import { CHECK_COOKIE, HUB_URL, SESSION_COOKIE, SITE_ORIGINS, SSO_CLIENT, cookieBase, hubCall, readSession, signSiteCall } from "@/lib/sso";

/**
 * Logs out here and everywhere: tells flameph.org server-to-server (the other sites end the session within 5 minutes),
 * then passes through flameph.org with a signed, single-use logout. Only from this site's own pages.
 */
export async function GET(req: NextRequest) {
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return NextResponse.redirect(`${SITE_ORIGINS[0]}/`);
  const member = readSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (member) await hubCall("/api/sso/logout", "sso-logout", { sub: member.sub });
  const t = signSiteCall("logout", {});
  const res = NextResponse.redirect(`${HUB_URL}/sso/logout?client=${SSO_CLIENT}&return=${encodeURIComponent(`${SITE_ORIGINS[0]}/`)}${t ? `&t=${encodeURIComponent(t)}` : ""}`, { headers: { "Cache-Control": "no-store" } });
  res.cookies.set(SESSION_COOKIE, "", { ...cookieBase, maxAge: 0 });
  res.cookies.set(CHECK_COOKIE, "off", { ...cookieBase, maxAge: 60 * 60 * 24 * 365 });
  return res;
}

export const dynamic = "force-dynamic";
