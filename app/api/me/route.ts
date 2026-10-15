import { NextResponse, type NextRequest } from "next/server";
import { CHECK_COOKIE, SESSION_COOKIE, readSession, ssoEnabled } from "@/lib/sso";

/** Who is signed in, for the site's scripts. `check` asks the page to look the visitor up on flameph.org once. */
export async function GET(req: NextRequest) {
  const member = readSession(req.cookies.get(SESSION_COOKIE)?.value);
  const enabled = ssoEnabled();
  const check = enabled && !member && !req.cookies.has(CHECK_COOKIE) && req.nextUrl.hostname.endsWith("negosyodepot.com");
  return NextResponse.json({ enabled, signedIn: !!member, member, check }, { headers: { "Cache-Control": "no-store" } });
}

export const dynamic = "force-dynamic";
