import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { BADGE_TAG, verifyHubMessage } from "@/lib/sso";

/** flameph.org tells us to drop badges now (consent 3 turned off, or the badge switch turned off). Signed with this site's key. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { token?: unknown } | null;
  const c = typeof body?.token === "string" ? verifyHubMessage("hub-notice", body.token) : null;
  if (!c || c.what !== "badge-drop") return NextResponse.json({ error: "bad_request" }, { status: 401 });
  revalidateTag(BADGE_TAG);
  return NextResponse.json({ ok: true });
}

export const dynamic = "force-dynamic";
