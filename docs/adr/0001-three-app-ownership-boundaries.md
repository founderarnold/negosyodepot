# ADR 0001: Three-app ownership boundaries

- Status: Accepted
- Date: 2026-11-26

## Context

FLAME PH, MarketplacePH, and NegosyoDepot share an ecosystem and account journey, but duplicate records would create conflicting identity, catalog, order, and fulfillment truth.

## Decision

- FLAME PH owns member identity, authentication, membership status, consented source profile fields, and ecosystem-wide logout/revocation.
- MarketplacePH owns retail product/service listings, SKUs, commercial prices, sellable retail stock, consumer orders, ordinary marketplace delivery booking, jobs, hiring, and marketplace messaging.
- NegosyoDepot owns business opportunity discovery, B2B capability profiles, fulfillment applications, reviewer decisions, matching, service-area approvals, operational availability, fulfillment status history, and its audit trail.

Every shared reference uses a stable source-issued identifier plus source system. No app silently copies another app's authoritative record and becomes a competing editor.

## Consequences

Cross-app screens may display cached projections, but must name their source and freshness. Writes return to the owning app or use an approved server contract. A combined dashboard does not imply combined data ownership.
