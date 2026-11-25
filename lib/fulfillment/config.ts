import "server-only";

const present = (value: string | undefined) => typeof value === "string" && value.trim().length > 0;

export function fulfillmentConfig() {
  const databaseConfigured = present(process.env.NEXT_PUBLIC_SUPABASE_URL) && present(process.env.SUPABASE_SERVICE_ROLE_KEY);
  const enabled = process.env.NEXT_PUBLIC_FULFILLMENT_ENABLED === "true" && databaseConfigured;
  return { databaseConfigured, enabled };
}
