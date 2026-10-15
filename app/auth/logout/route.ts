import { NextResponse } from "next/server";
import { CHECK_COOKIE, HUB_URL, SESSION_COOKIE, SITE_ORIGINS, SSO_CLIENT, cookieBase } from "@/lib/sso";

/** Logs out here and on flameph.org (which also covers the other FLAME PH sites signed in through it). */
export async function GET() {
  const res = NextResponse.redirect(`${HUB_URL}/sso/logout?client=${SSO_CLIENT}&return=${encodeURIComponent(`${SITE_ORIGINS[0]}/`)}`, { headers: { "Cache-Control": "no-store" } });
  res.cookies.delete(SESSION_COOKIE);
  res.cookies.set(CHECK_COOKIE, "off", { ...cookieBase, maxAge: 60 * 60 * 24 * 365 });
  return res;
}

export const dynamic = "force-dynamic";
