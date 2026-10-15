import { NextResponse, type NextRequest } from "next/server";
import { CHECK_COOKIE, HUB_URL, SSO_CLIENT, backTo, cookieBase, publicUrl, ssoEnabled } from "@/lib/sso";

/**
 * Sends the visitor to flameph.org to find out who they are.
 *   /auth/flame/start?mode=login|join&next=<path on this site, hash included>   sign in or join on flameph.org first
 *   /auth/flame/start?silent=1&next=…                                          only check, never show a login page
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const back = backTo(sp.get("next"), req.nextUrl.origin);
  if (!ssoEnabled()) return NextResponse.redirect(back);

  const silent = sp.get("silent") === "1";
  const authorize = `/sso/authorize?client=${SSO_CLIENT}&return=${encodeURIComponent(publicUrl(back))}${silent ? "&silent=1" : ""}`;
  const target = sp.get("mode") === "join" && !silent ? `${HUB_URL}/join?next=${encodeURIComponent(authorize)}` : `${HUB_URL}${authorize}`;

  const res = NextResponse.redirect(target, { headers: { "Cache-Control": "no-store" } });
  // Check with the hub at most every 6 hours, and never again on its own after logging out.
  if (silent) res.cookies.set(CHECK_COOKIE, "checked", { ...cookieBase, maxAge: 60 * 60 * 6 });
  else res.cookies.delete(CHECK_COOKIE);
  return res;
}

export const dynamic = "force-dynamic";
