import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const migrationPath = resolve(here, "../supabase/migrations/202611260001_fulfillment_foundation.sql");
const sql = readFileSync(migrationPath, "utf8");

const requiredTables = [
  "organizations",
  "organization_memberships",
  "platform_role_assignments",
  "ecosystem_identity_links",
  "profile_sync_consents",
  "profile_sync_runs",
  "field_sync_conflicts",
  "fulfillment_applications",
  "fulfillment_application_status_history",
  "application_service_areas",
  "brand_capabilities",
  "hub_facilities",
  "logistics_capabilities",
  "provider_capabilities",
  "application_evidence",
  "audit_events",
  "integration_outbox",
  "integration_inbox",
];

const failures = [];
for (const table of requiredTables) {
  if (!new RegExp(`create table public\\.${table}\\s*\\(`, "i").test(sql)) failures.push(`missing table: ${table}`);
  if (!new RegExp(`alter table public\\.${table} enable row level security`, "i").test(sql)) failures.push(`RLS not enabled: ${table}`);
}

const requiredPolicies = [
  "applications_select",
  "applications_insert",
  "applications_update",
  "sync_consents_self_select",
  "evidence_select",
  "fulfillment_evidence_select",
  "fulfillment_evidence_insert",
];
for (const policy of requiredPolicies) {
  if (!new RegExp(`create policy ${policy}\\b`, "i").test(sql)) failures.push(`missing policy: ${policy}`);
}

if (!/values\s*\(\s*'fulfillment-evidence',[\s\S]*?false,/i.test(sql)) failures.push("evidence bucket is not explicitly private");
if (/create policy\s+\S+\s+on\s+(?:public\.)?\S+\s+for delete/i.test(sql)) failures.push("unexpected browser delete policy");
if (!/revoke all on public\.integration_outbox, public\.integration_inbox from anon, authenticated/i.test(sql)) failures.push("integration queues are not closed to browser roles");
if (/eyJ[A-Za-z0-9_-]{20,}|service_role\s*=|password\s*=\s*['"][^'"]+/i.test(sql)) failures.push("possible secret literal in migration");

if (failures.length) {
  console.error(failures.map((failure) => `- ${failure}`).join("\n"));
  process.exit(1);
}

console.log(`Fulfillment migration contract passed: ${requiredTables.length} RLS tables, private evidence storage, no browser delete policy.`);
