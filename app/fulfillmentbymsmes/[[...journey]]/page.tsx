import { redirect } from "next/navigation";

type PageProps = {
  params: Promise<{ journey?: string[] }>;
};

const allowedJourneys = new Set(["brands", "hubs", "logistics", "providers"]);

export default async function FulfillmentByMsmesRoute({ params }: PageProps) {
  const { journey = [] } = await params;
  const requestedJourney = journey[0];
  const suffix = requestedJourney && allowedJourneys.has(requestedJourney) ? `/${requestedJourney}` : "";

  redirect(`/#/fulfillmentbymsmes${suffix}`);
}
