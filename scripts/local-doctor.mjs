const checks = [
  {
    name: "NegosyoDepot app",
    url: "http://127.0.0.1:3000/fulfillmentbymsmes",
    validate: (_response, text) => text.includes("NegosyoDepot"),
  },
  {
    name: "Fulfillment API",
    url: "http://127.0.0.1:3000/api/fulfillment/status",
    validate: (_response, text) => {
      const status = JSON.parse(text);
      return status.ok === true && status.enabled === true && status.databaseConfigured === true;
    },
  },
  {
    name: "Supabase Auth",
    url: "http://127.0.0.1:57321/auth/v1/health",
    validate: (response) => response.ok,
  },
  {
    name: "Supabase Storage",
    url: "http://127.0.0.1:57321/storage/v1/status",
    validate: (response) => response.ok,
  },
  {
    name: "Supabase Studio",
    url: "http://127.0.0.1:57323/project/default",
    validate: (_response, text) => text.includes("Supabase"),
  },
];

let failed = false;
for (const check of checks) {
  try {
    const response = await fetch(check.url, { signal: AbortSignal.timeout(5000) });
    const text = await response.text();
    const valid = response.ok && check.validate(response, text);
    console.log(`${valid ? "PASS" : "FAIL"}  ${check.name.padEnd(18)} ${check.url}`);
    failed ||= !valid;
  } catch {
    console.log(`FAIL  ${check.name.padEnd(18)} ${check.url}`);
    failed = true;
  }
}

console.log("\nOpen the NegosyoDepot app on port 3000. Port 57321 is a service gateway and intentionally has no web page at its root.");
if (failed) {
  console.log("If the app check failed, run npm run local:app. If Supabase failed, run npm run local:supabase:start.");
  process.exit(1);
}
