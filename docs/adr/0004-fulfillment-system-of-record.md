# ADR 0004: Fulfillment system of record

- Status: Accepted
- Date: 2026-11-26

## Context

Fulfillment spans brand requests, facility and provider capability, logistics, accreditation, availability, stock custody, order execution, and settlement. One database must not silently become authoritative for records owned by another app.

## Decision

NegosyoDepot is the system of record for fulfillment applications, capabilities, reviewer assignments and decisions, approved service areas, evidence metadata, matching, operational availability, fulfillment workflow/status history, and integration audit events.

MarketplacePH remains authoritative for retail catalog, price, sellable stock, consumer order, and marketplace delivery booking. POS/retail inventory and fulfillment-custody inventory remain separate authorities. Cross-system stock movement is an immutable, idempotent event/ledger handoff; it never overwrites retail stock directly. No business or audit history is deleted as an operational rollback.

## Consequences

The feature kill switch stays off outside isolated local testing. Evidence storage is private, browser deletion is prohibited, status escalation is reviewer-controlled, and integration inbox/outbox access is server-only. Payments and real-money movement remain out of scope for the pilot baseline.
