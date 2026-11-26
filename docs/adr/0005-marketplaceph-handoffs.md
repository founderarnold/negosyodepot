# ADR 0005: MarketplacePH handoffs

- Status: Accepted
- Date: 2026-11-26

## Context

NegosyoDepot needs MarketplacePH product and order context without duplicating the retail marketplace or ordinary rider workflow.

## Decision

- Catalog selection uses stable MarketplacePH listing/SKU identifiers and read-only projections; create/edit/price actions hand off to MarketplacePH.
- Consumer checkout, payment state, retail order changes, cancellation/refund, and ordinary delivery booking hand off to MarketplacePH.
- NegosyoDepot may create a fulfillment request that references a MarketplacePH order only through an authenticated, user-authorized, idempotent server contract.
- B2B logistics capability and fulfillment execution status belong to NegosyoDepot; MarketplacePH receives bounded status events needed for its customer order view.
- Jobs, hiring, and marketplace messaging remain MarketplacePH features. NegosyoDepot may link or refer but does not clone them.

Every handoff carries source system, stable source ID, event/schema version, idempotency key, correlation ID, consent/legal basis where applicable, and a bounded payload. Secrets and privileged calls remain server-side.

## Consequences

The current baseline provides interface boundaries and integration inbox/outbox tables only. No MarketplacePH sync is enabled until its owner approves API authentication, scopes, events, retries, reconciliation, rate limits, and deletion/correction behavior.
