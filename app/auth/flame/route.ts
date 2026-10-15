import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, SESSION_DAYS, backTo, cookieBase, signSession, verifyHubToken } from "@/lib/sso";

/** flameph.org sends visitors back here with a signed token (signed in there) or error=login_required. */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const token = sp.get("token");
  const claims = token ? verifyHubToken(token) : null;
  const session = claims ? signSession({ email: claims.email, name: claims.name }) : null;

  const res = NextResponse.redirect(backTo(sp.get("next"), req.nextUrl.origin), { headers: { "Referrer-Policy": "no-referrer", "Cache-Control": "no-store" } });
  if (session) res.cookies.set(SESSION_COOKIE, session, { ...cookieBase, maxAge: SESSION_DAYS * 86400 });
  else if (token) console.error("auth/flame: token rejected");
  return res;
}

export const dynamic = "force-dynamic";
