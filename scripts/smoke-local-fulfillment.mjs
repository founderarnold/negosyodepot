import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";

const env = { ...process.env };
for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
  if (match && env[match[1]] === undefined) env[match[1]] = match[2];
}

const secret = env.SSO_SECRET_NEGOSYODEPOT;
if (!secret || secret.length < 32) throw new Error("Run npm run local:supabase:env first.");

const port = 3300;
const origin = `http://localhost:${port}`;
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", String(port)], {
  cwd: process.cwd(),
  env,
  stdio: ["ignore", "pipe", "pipe"],
});

let serverOutput = "";
server.stdout.on("data", (chunk) => { serverOutput += String(chunk); });
server.stderr.on("data", (chunk) => { serverOutput += String(chunk); });

const stop = () => {
  if (!server.pid) return;
  if (process.platform === "win32") {
    spawnSync("taskkill", ["/PID", String(server.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    server.kill("SIGTERM");
  }
};

const waitForServer = async () => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Next.js exited before startup.\n${serverOutput.slice(-2000)}`);
    try {
      const response = await fetch(`${origin}/api/fulfillment/status`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Next.js did not become ready.\n${serverOutput.slice(-2000)}`);
};

const signSession = () => {
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: "negosyodepot",
    aud: "negosyodepot-session-v2",
    email: "local-fulfillment-test@example.invalid",
    name: "Local Fulfillment Test",
    sub: "local-fulfillment-smoke-subject",
    since: now,
    chk: now,
    iat: now,
    exp: now + 3600,
  };
  const body = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = createHmac("sha256", secret).update(body).digest("base64url");
  return `v1.${body}.${signature}`;
};

const request = async (path, init = {}) => {
  const response = await fetch(`${origin}${path}`, {
    ...init,
    headers: {
      origin,
      cookie: `nd_session=${signSession()}`,
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });
  const body = await response.json();
  return { response, body };
};

try {
  await waitForServer();

  const identity = await request("/api/fulfillment/identity", { method: "POST", body: "{}" });
  if (![200, 201].includes(identity.response.status) || !identity.body.identityLinked) {
    throw new Error(`Identity link failed with ${identity.response.status} (${identity.body.error || "unknown"}).`);
  }

  const applicationBody = JSON.stringify({
    role: "brand_owner",
    idempotencyKey: "local-smoke-idempotency-0001",
  });
  const first = await request("/api/fulfillment/applications", { method: "POST", body: applicationBody });
  const second = await request("/api/fulfillment/applications", { method: "POST", body: applicationBody });
  if (first.response.status !== 201 || second.response.status !== 201) {
    throw new Error(`Application creation failed with ${first.response.status}/${second.response.status}.`);
  }
  if (!first.body.application?.id || first.body.application.id !== second.body.application?.id) {
    throw new Error("Idempotent application creation returned different records.");
  }

  const listing = await request("/api/fulfillment/applications");
  if (listing.response.status !== 200 || listing.body.applications?.length !== 1) {
    throw new Error("Application listing did not return exactly one local test application.");
  }

  console.log("Local fulfillment smoke test passed: identity, idempotent application, and owner listing.");
} finally {
  stop();
}
