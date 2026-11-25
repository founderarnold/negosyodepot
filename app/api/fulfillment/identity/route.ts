import { randomUUID } from "node:crypto";
import { type NextRequest } from "next/server";
import { fulfillmentAdmin } from "@/lib/fulfillment/admin";
import { fulfillmentConfig } from "@/lib/fulfillment/config";
import { flameSession, fulfillmentActor, sameOriginWrite } from "@/lib/fulfillment/request";
import { fulfillmentError, fulfillmentJson } from "@/lib/fulfillment/responses";

export async function POST(req: NextRequest) {
  if (!sameOriginWrite(req)) return fulfillmentError("invalid_origin", 403);
  const config = fulfillmentConfig();
  if (!config.enabled) return fulfillmentError("fulfillment_disabled", 503);

  const session = flameSession(req);
  if (!session) return fulfillmentError("sign_in_required", 401);
  const existing = await fulfillmentActor(req);
  if (existing) return fulfillmentJson({ ok: true, identityLinked: true });

  const admin = fulfillmentAdmin();
  const created = await admin.auth.admin.createUser({
    email: session.email,
    email_confirm: true,
    user_metadata: { full_name: session.name ?? null },
    app_metadata: { identity_source: "flameph", flame_sub: session.sub },
  });
  if (created.error || !created.data.user) {
    // Never auto-link an existing local account by matching email alone.
    return fulfillmentError("identity_requires_review", 409);
  }

  const userId = created.data.user.id;
  const linked = await admin.from("ecosystem_identity_links").insert({
    user_id: userId,
    issuer: "flameph",
    subject: session.sub,
    verified_email: session.email.toLowerCase(),
    display_name: session.name ?? null,
    source_version: "sso-v2",
  });

  if (linked.error) {
    await admin.auth.admin.deleteUser(userId).catch(() => undefined);
    return fulfillmentError("identity_link_failed", 409);
  }

  await admin.from("audit_events").insert({
    actor_user_id: userId,
    actor_type: "member",
    action: "ecosystem_identity.linked",
    entity_type: "ecosystem_identity_link",
    entity_id: userId,
    correlation_id: randomUUID(),
    source_system: "flameph",
    changed_fields: ["issuer", "subject", "verified_email", "display_name"],
    safe_metadata: { sourceVersion: "sso-v2" },
  });

  return fulfillmentJson({ ok: true, identityLinked: true }, 201);
}

export const dynamic = "force-dynamic";
