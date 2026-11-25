import { randomUUID } from "node:crypto";
import { type NextRequest } from "next/server";
import { fulfillmentAdmin } from "@/lib/fulfillment/admin";
import { fulfillmentConfig } from "@/lib/fulfillment/config";
import { fulfillmentActor, requestTooLarge, sameOriginWrite } from "@/lib/fulfillment/request";
import { fulfillmentError, fulfillmentJson } from "@/lib/fulfillment/responses";

const roles = new Set(["brand_owner", "hub_operator", "logistics_provider", "b2b_provider"]);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const idempotency = /^[A-Za-z0-9._:-]{16,128}$/;

export async function GET(req: NextRequest) {
  const config = fulfillmentConfig();
  if (!config.enabled) return fulfillmentError("fulfillment_disabled", 503);
  const actor = await fulfillmentActor(req);
  if (!actor) return fulfillmentError("identity_link_required", 401);

  const { data, error } = await fulfillmentAdmin()
    .from("fulfillment_applications")
    .select("id, reference_number, role, status, submitted_at, decided_at, expires_at, created_at, updated_at")
    .eq("created_by", actor.userId)
    .order("updated_at", { ascending: false })
    .limit(50);
  if (error) return fulfillmentError("applications_unavailable", 503);
  return fulfillmentJson({ ok: true, applications: data ?? [] });
}

export async function POST(req: NextRequest) {
  if (!sameOriginWrite(req)) return fulfillmentError("invalid_origin", 403);
  if (requestTooLarge(req)) return fulfillmentError("request_too_large", 413);
  const config = fulfillmentConfig();
  if (!config.enabled) return fulfillmentError("fulfillment_disabled", 503);
  const actor = await fulfillmentActor(req);
  if (!actor) return fulfillmentError("identity_link_required", 401);

  let body: { role?: unknown; idempotencyKey?: unknown; organizationId?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return fulfillmentError("invalid_json", 400);
  }

  const role = typeof body.role === "string" ? body.role : "";
  const key = typeof body.idempotencyKey === "string" ? body.idempotencyKey : "";
  const organizationId = typeof body.organizationId === "string" && body.organizationId ? body.organizationId : null;
  if (!roles.has(role)) return fulfillmentError("invalid_role", 400);
  if (!idempotency.test(key)) return fulfillmentError("invalid_idempotency_key", 400);
  if (organizationId && !uuid.test(organizationId)) return fulfillmentError("invalid_organization", 400);

  const correlationId = randomUUID();
  const { data, error } = await fulfillmentAdmin().rpc("create_fulfillment_application", {
    actor_user_id: actor.userId,
    application_role: role,
    request_idempotency_key: key,
    request_correlation_id: correlationId,
    target_organization_id: organizationId,
  });
  if (error || !data) return fulfillmentError("application_create_failed", 409);

  const application = Array.isArray(data) ? data[0] : data;
  return fulfillmentJson({
    ok: true,
    application: {
      id: application.id,
      referenceNumber: application.reference_number,
      role: application.role,
      status: application.status,
      createdAt: application.created_at,
      updatedAt: application.updated_at,
    },
    correlationId,
  }, 201);
}

export const dynamic = "force-dynamic";
