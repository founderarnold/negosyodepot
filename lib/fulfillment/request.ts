import "server-only";
import { type NextRequest } from "next/server";
import { SESSION_COOKIE, readSession, type Session } from "@/lib/sso";
import { fulfillmentAdmin } from "@/lib/fulfillment/admin";

export type FulfillmentActor = {
  userId: string;
  subject: string;
  session: Session & { exp: number };
};

export function sameOriginWrite(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === req.nextUrl.origin;
  } catch {
    return false;
  }
}

export function flameSession(req: NextRequest) {
  return readSession(req.cookies.get(SESSION_COOKIE)?.value);
}

export async function fulfillmentActor(req: NextRequest): Promise<FulfillmentActor | null> {
  const session = flameSession(req);
  if (!session) return null;
  const { data, error } = await fulfillmentAdmin()
    .from("ecosystem_identity_links")
    .select("user_id, subject")
    .eq("issuer", "flameph")
    .eq("subject", session.sub)
    .maybeSingle();
  if (error || !data?.user_id || data.subject !== session.sub) return null;
  return { userId: String(data.user_id), subject: session.sub, session };
}

export function requestTooLarge(req: NextRequest, maximumBytes = 64 * 1024): boolean {
  const length = Number(req.headers.get("content-length") ?? 0);
  return Number.isFinite(length) && length > maximumBytes;
}
