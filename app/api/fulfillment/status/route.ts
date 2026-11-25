import { type NextRequest } from "next/server";
import { fulfillmentConfig } from "@/lib/fulfillment/config";
import { flameSession, fulfillmentActor } from "@/lib/fulfillment/request";
import { fulfillmentJson } from "@/lib/fulfillment/responses";

export async function GET(req: NextRequest) {
  const config = fulfillmentConfig();
  const signedIn = !!flameSession(req);
  const actor = config.databaseConfigured && signedIn ? await fulfillmentActor(req).catch(() => null) : null;
  return fulfillmentJson({
    ok: true,
    enabled: config.enabled,
    databaseConfigured: config.databaseConfigured,
    signedIn,
    identityLinked: !!actor,
  });
}

export const dynamic = "force-dynamic";
