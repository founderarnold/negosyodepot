import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, { cwd: process.cwd(), encoding: "utf8", ...options });
  if (result.status !== 0) {
    if (result.stdout) process.stderr.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    process.exit(result.status || 1);
  }
};

run(process.execPath, ["node_modules/supabase/dist/supabase.js", "db", "reset"]);

for (const path of [
  "supabase/tests/fulfillment_foundation_structural.sql",
  "supabase/tests/fulfillment_foundation_rls.sql",
]) {
  run(
    "docker",
    ["exec", "-i", "supabase_db_negosyodepot-phase1", "psql", "-v", "ON_ERROR_STOP=1", "-U", "postgres", "-d", "postgres"],
    { input: readFileSync(path, "utf8") },
  );
}

console.log("Local Supabase migration, structural controls, and behavioral RLS tests passed.");
