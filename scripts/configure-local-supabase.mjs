import { randomBytes } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const result = spawnSync(process.execPath, ["node_modules/supabase/dist/supabase.js", "status", "--output", "json"], {
  cwd: process.cwd(),
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});

if (result.status !== 0) {
  console.error("Local Supabase is not running. Start it with npm run local:supabase:start.");
  process.exit(result.status || 1);
}

let status;
try {
  status = JSON.parse(result.stdout);
} catch {
  console.error("Could not read local Supabase status.");
  process.exit(1);
}

const required = ["API_URL", "ANON_KEY", "SERVICE_ROLE_KEY"];
if (required.some((name) => typeof status[name] !== "string" || !status[name])) {
  console.error("Local Supabase status did not include the required connection fields.");
  process.exit(1);
}

const envPath = ".env.local";
const existing = (() => {
  try {
    return readFileSync(envPath, "utf8");
  } catch {
    return "";
  }
})();

const values = new Map();
for (const line of existing.split(/\r?\n/)) {
  const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
  if (match) values.set(match[1], match[2]);
}

values.set("NEXT_PUBLIC_SUPABASE_URL", status.API_URL);
values.set("NEXT_PUBLIC_SUPABASE_ANON_KEY", status.ANON_KEY);
values.set("SUPABASE_SERVICE_ROLE_KEY", status.SERVICE_ROLE_KEY);
values.set("NEXT_PUBLIC_FULFILLMENT_ENABLED", "true");
if (!values.get("SSO_SECRET_NEGOSYODEPOT")) {
  values.set("SSO_SECRET_NEGOSYODEPOT", randomBytes(32).toString("base64url"));
}

const preferred = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SSO_SECRET_NEGOSYODEPOT",
  "NEXT_PUBLIC_FULFILLMENT_ENABLED",
];
const remaining = [...values.keys()].filter((name) => !preferred.includes(name)).sort();
const names = [...preferred, ...remaining];
writeFileSync(envPath, `${names.map((name) => `${name}=${values.get(name)}`).join("\n")}\n`, {
  encoding: "utf8",
  mode: 0o600,
});

console.log("Wrote local-only Supabase settings to ignored .env.local (secret values hidden).");
