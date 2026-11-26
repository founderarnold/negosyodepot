# FLAME PH ecosystem profile, consent, catalog, and inventory contract

- Contract family: `ph.flame.ecosystem`
- Contract version: `1.0.0-draft.1`
- Date: 2026-11-26
- Status: **Draft — owner and privacy approval required; not authorized for implementation**
- Owners: FLAME PH, NegosyoDepot, MarketplacePH
- Related decisions: ADR 0001, ADR 0002, ADR 0003, ADR 0004, ADR 0005, and `SSO_HARDENING_GATE.md`

This package defines data ownership and exchange behavior before profile-sync UI is built. It does not create an API, grant database access, change identity mappings, enable synchronization, or authorize production credentials.

## 1. Non-negotiable boundaries

1. A browser never reads or writes another application's database directly.
2. No application receives a permanent unrestricted service key to another application.
3. User-driven access uses Authorization Code with PKCE and an approved OIDC/OAuth profile. Backend delivery uses a separate audience-bound, scope-bound service credential or signed webhook secret per client and environment.
4. Every shared record carries its source system, immutable source identifier, schema version, record version, purpose, consent/legal-basis reference where applicable, and freshness time.
5. A projection does not become a second source of truth. Source-owned fields are read-only outside their owner.
6. Email is a verified claim, not a permanent identity key. No records are automatically merged because email matches.
7. MarketplacePH remains authoritative for catalog and sellable stock. NegosyoDepot does not maintain a second independent sellable-stock total.

## 2. Stable identifiers

| Identifier | Format and issuer | Mutability | Rule |
|---|---|---:|---|
| `ecosystem_subject_id` | FLAME PH opaque UUID, serialized as `urn:flameph:subject:<uuid>` | Immutable | Permanent person key; never derived from email, phone, name, or membership number. |
| `ecosystem_organization_id` | FLAME PH opaque UUID, `urn:flameph:org:<uuid>` | Immutable | Master organization identity. Business display and operational profiles remain app-owned. |
| `external_identity_key` | Tuple `(issuer, sub)` | Immutable | Unique in each relying party. The tuple, not `sub` alone, is the key. |
| `marketplace_listing_id` | MarketplacePH UUID/ULID | Immutable | Stable listing identity even when unpublished. Never recycled. |
| `marketplace_sku_id` | MarketplacePH UUID/ULID | Immutable | Stable variant/SKU identity. Never recycled. |
| `negosyo_opportunity_id` | NegosyoDepot UUID/ULID | Immutable | Business-opportunity identity. |
| `fulfillment_request_id` | NegosyoDepot UUID/ULID | Immutable | Fulfillment workflow identity. |
| `reservation_id` | NegosyoDepot UUID/ULID | Immutable | Operational reservation request; acceptance references a MarketplacePH inventory version. |
| `event_id` | Source-issued UUIDv7/ULID | Immutable | Globally unique event identifier and idempotency anchor. |
| `correlation_id` | Initiating system UUIDv7/ULID | Immutable per workflow | Traces a workflow across requests and events without exposing a person identifier in logs. |

Identifiers must be random/opaque, never sequential public database keys, and never reassigned. A merge or split creates an audited mapping decision; it does not rewrite event history.

## 3. Authorization and scopes

### 3.1 User-authorized flow

Use Authorization Code with PKCE, exact registered redirect URIs, browser-bound state and nonce, short-lived one-time codes, audience checking, issuer checking, and atomic replay prevention. Access tokens are audience-specific and short-lived. Refresh tokens, if approved, are sender-constrained or rotated with reuse detection and are stored server-side only.

### 3.2 Server-to-server flow

Use one credential per application, environment, and audience. A service may use OAuth client credentials for non-user outbox delivery, or a per-client webhook signing key for pushed events. User-specific reads require a current consent grant or approved token exchange that carries the subject and granted scopes. Service credentials cannot expand a user's scopes.

### 3.3 Allowed scopes

| Scope | Owner | Allowed consumer and purpose |
|---|---|---|
| `openid` | FLAME PH | Authenticate and receive immutable `sub`. |
| `identity.basic.read` | FLAME PH | Display name and verified contact claims for the signed-in user's requested journey. |
| `membership.status.read` | FLAME PH | Show current membership eligibility; not payment history. |
| `master_profile.read` | FLAME PH | Read only the user-selected master fields. |
| `organization.identity.read` | FLAME PH | Resolve approved organization identity and membership/role. |
| `negosyo.opportunity.read` | NegosyoDepot | Read approved business opportunities. |
| `negosyo.opportunity.write` | NegosyoDepot | Create/update an opportunity through NegosyoDepot only. |
| `negosyo.b2b_capability.read` | NegosyoDepot | Read consented B2B capability fields. |
| `negosyo.b2b_capability.write` | NegosyoDepot | Update capability through NegosyoDepot only. |
| `negosyo.fulfillment.application.write` | NegosyoDepot | Submit/update the user's application. |
| `negosyo.fulfillment.status.read` | NegosyoDepot | Read the subject's or organization's fulfillment status. |
| `marketplace.catalog.read` | MarketplacePH | Read published catalog projection for an approved NegosyoDepot purpose. |
| `marketplace.inventory.snapshot.read` | MarketplacePH | Read current versioned sellable-stock snapshot when operationally required. |
| `marketplace.inventory.reservation.request` | MarketplacePH | Request MarketplacePH to recognize or reject a NegosyoDepot reservation impact. |
| `marketplace.order.fulfillment_status.write` | MarketplacePH | Post bounded fulfillment milestones for an authorized order. |

There is no `*.all`, unrestricted admin, cross-tenant, raw-database, payment, private-message, job-applicant, or rider-location scope in this contract.

## 4. Ownership by domain

### 4.1 FLAME PH-owned

- authentication and immutable ecosystem subject;
- verified email/phone claims and verification times;
- membership status, tier, chapter, dates, and roles;
- community profile and master person/organization fields explicitly approved for reuse;
- ecosystem consent receipts, identity-link decisions, global unlink/revocation signals.

### 4.2 NegosyoDepot-owned

- business opportunities, sale/pasalo/franchise opportunity records and moderation;
- B2B capability, capacity, service areas, availability, accreditations and evidence metadata;
- fulfillment applications, review assignments, decisions, appeals, and operational eligibility;
- fulfillment requests, matching, reservations, allocations, custody, hub condition, in-transit quantities, packing, dispatch, returns, exception and reconciliation ledgers;
- NegosyoDepot comments, reactions, posts, safety actions, and audit history once a reviewed server feed exists.

### 4.3 MarketplacePH-owned

- listing/SKU identity, descriptions, images, current commercial prices, promotions and publication state;
- MarketplacePH sellable stock and its authoritative inventory version;
- store profile and consumer orders, checkout/payment/refund state;
- ordinary consumer delivery/rider booking;
- jobs, applicants, hiring, MarketplacePH messaging and reviews.

## 5. Field dictionary and lifecycle

`Visibility` values are `private`, `organization`, `members`, or `public`. A consumer may display only the granted visibility and its own purpose.

| Field | Source of truth / writer | Consumers | Visibility | Purpose | Retention and correction |
|---|---|---|---|---|---|
| `sub` | FLAME PH | All relying parties | Private | Stable identity link | Keep while linked; unlink projection within 30 days; correction only through identity recovery. |
| `email`, `email_verified`, `email_verified_at` | FLAME PH | User-authorized apps | Private | Notices and account recovery | Refresh on use; purge projection within 30 days of unlink; FLAME PH corrects. |
| `display_name`, `avatar_url` | FLAME PH master profile | User-authorized apps | User-selected | Recognition and profile prefilling | Cache up to 24 hours; correct at FLAME PH or copy into an app-owned override clearly labelled local. |
| `membership_status`, `tier`, `chapter`, `valid_until` | FLAME PH | NegosyoDepot, MarketplacePH | Private/member | Eligibility and member experience | Cache 24 hours; stale after 24 hours; purge 30 days after unlink. |
| `organization_identity`, `member_role` | FLAME PH | Both apps | Private/organization | Prove association and authorized role | Recheck on privileged action; role revocation effective immediately on next online check. |
| `business_legal_name`, `registration_reference` | FLAME PH master organization, if verified | Approved workflows | Private/organization | Prefill and verification reference | Do not publish by default; correction at FLAME PH; cache 30 days. |
| `opportunity_title`, `opportunity_type`, `asking_terms`, `opportunity_status` | NegosyoDepot | FLAME PH link cards; approved MarketplacePH handoff | Public/member/private per record | Business buying, selling, pasalo, franchise | Retain while active plus 24 months; unpublish immediately; purge public caches within 24 hours. |
| `b2b_capabilities`, `service_areas`, `capacity`, `availability` | NegosyoDepot | Approved ecosystem matching | User-selected | B2B discovery and matching | Refresh per declared cadence; expire visibly when stale; owner corrects in NegosyoDepot. |
| `fulfillment_application`, `review_state`, `evidence_metadata` | NegosyoDepot | Applicant and authorized reviewers | Private | Application and review | Unsuccessful applications: 24 months after final decision; approved providers: active relationship plus 24 months; evidence follows stricter approved schedule. |
| `fulfillment_status`, `custody_event`, `condition`, `in_transit_qty` | NegosyoDepot | Authorized organization and MarketplacePH bounded order view | Private/organization | Execute and reconcile fulfillment | Five years after workflow close, subject to privacy/legal review; corrections are compensating events. |
| `listing_id`, `sku_id`, `description`, `images`, `publication_state` | MarketplacePH | NegosyoDepot catalog projection | Public or authorized | Show current sellable item context | Cache no more than 24 hours; unpublish event hides immediately; MarketplacePH corrects. |
| `commercial_price`, `currency`, `price_version` | MarketplacePH | NegosyoDepot reservation/quote context | Authorized/public | Current display and immutable price snapshot | Current cache 15 minutes; transaction snapshot retained with the operational record. |
| `sellable_stock`, `inventory_version` | MarketplacePH | NegosyoDepot operational service only | Private/organization | Validate availability | Short-lived snapshot, maximum 60 seconds unless source gives shorter TTL; never presented as independently owned total. |
| `consumer_order_reference` | MarketplacePH | NegosyoDepot fulfillment workflow | Private | Correlate authorized fulfillment | Store only opaque reference and required line context; follow order/fulfillment schedule. |
| `job`, `applicant`, `rider_booking`, `marketplace_message` | MarketplacePH only | Links/handoffs only | Owner-defined | Marketplace workflows | Not synchronized under this contract. |

### 5.1 Retention controls

- Consent receipts: account lifetime plus five years after withdrawal, pseudonymized where possible, pending privacy/legal approval.
- API/audit events: 24 months searchable plus 36 months restricted archive; payload values are minimized or hashed.
- Idempotency records: 30 days after the last accepted retry.
- Failed webhook bodies: 30 days; metadata/dead-letter reason: 90 days unless escalated.
- Revoked profile projections: inaccessible immediately and purged within 30 days unless an approved legal hold applies.
- Public caches: invalidate immediately; maximum propagation target 24 hours, shown to the user during unpublishing.

No retention rule permits silent reuse for advertising, credit scoring, sale of data, or unrelated analytics.

## 6. Consent contract

Consent is opt-in, field-scoped, purpose-scoped, destination-specific, versioned, and revocable. A missing, expired, mismatched, or revoked grant is denial.

### 6.1 Consent receipt

Required fields: `consent_id`, `subject`, `client_id`, `destination`, `scopes`, `field_ids`, `purposes`, `visibility`, `notice_version`, `granted_at`, `expires_at`, `revoked_at`, `locale`, and evidence of the interaction without recording secrets.

### 6.2 Versioned consent text

Consent text ID: `profile_share.en-PH.v1.0`

> Allow FLAME PH to share the fields you select with NegosyoDepot for the purposes shown below. NegosyoDepot will receive a source label and update time and may keep a limited copy while this permission is active. Your email is a contact claim, not your permanent account key. You can withdraw permission in FLAME PH settings. Withdrawal stops future sharing and hides the shared profile; limited consent, security, application, and transaction records may be retained under the stated retention schedule. Nothing is shared with MarketplacePH unless it is separately listed and selected.

The UI must list every field, destination, purpose, visibility, expiry, retention summary, correction location, and withdrawal consequence before confirmation. Pre-checked boxes and bundled unrelated consent are prohibited.

### 6.3 Correction, revocation, deletion, and unpublishing

- Correct source-owned data at its owner. Consumers refresh or mark a projection stale; they do not overwrite the source.
- A local app-owned annotation may coexist only under a different field ID and must be labelled as local.
- Revocation immediately blocks new reads and writes, emits `consent.revoked`, unpublishes consent-dependent public fields, and queues purge.
- Deleting an app account removes app-owned drafts and projections under its schedule; it does not delete source records owned by another app.
- Operational and audit events are not destructively edited. Privacy-approved erasure uses tombstoning/pseudonymization while preserving non-personal integrity.
- Organization administrators cannot consent for a person's private profile unless an approved authority model explicitly permits that field and purpose.

## 7. Profile API examples

### 7.1 Read selected fields

`POST /ecosystem/v1/profile:resolve`

```json
{
  "request_id": "01JEXAMPLEPROFILE0000000001",
  "subject": "urn:flameph:subject:6f1ca010-95cd-48c0-86d1-3f7d6214548f",
  "consent_id": "01JEXAMPLECONSENT0000000001",
  "purpose": "negosyodepot.profile_prefill",
  "fields": ["display_name", "membership_status", "organization_identity"],
  "client_context": {
    "client_id": "negosyodepot-staging",
    "correlation_id": "01JEXAMPLECORRELATION000001"
  }
}
```

```json
{
  "request_id": "01JEXAMPLEPROFILE0000000001",
  "subject": "urn:flameph:subject:6f1ca010-95cd-48c0-86d1-3f7d6214548f",
  "source": "flameph",
  "schema_version": "1.0.0",
  "record_version": 18,
  "consent": { "id": "01JEXAMPLECONSENT0000000001", "notice_version": "profile_share.en-PH.v1.0", "expires_at": "2027-02-26T00:00:00Z" },
  "fields": {
    "display_name": { "value": "Sample Member", "visibility": "members", "updated_at": "2026-11-20T04:00:00Z" },
    "membership_status": { "value": "active", "visibility": "private", "updated_at": "2026-11-25T02:00:00Z" },
    "organization_identity": { "value": { "id": "urn:flameph:org:2bb5f011-c507-4d02-8b6d-5ec357226532", "display_name": "Sample Enterprise", "role": "owner" }, "visibility": "organization", "updated_at": "2026-11-21T03:00:00Z" }
  },
  "fresh_until": "2026-11-27T00:00:00Z"
}
```

Values above are synthetic.

### 7.2 Idempotent app-owned update

`PUT /ecosystem/v1/negosyodepot/b2b-capabilities/{capability_id}` requires `Idempotency-Key` and `If-Match`.

```json
{
  "schema_version": "1.0.0",
  "organization_id": "urn:flameph:org:2bb5f011-c507-4d02-8b6d-5ec357226532",
  "expected_version": 7,
  "service_areas": ["PH-00-MNL"],
  "capabilities": ["packing", "dispatch"],
  "declared_capacity": { "unit": "orders_per_day", "value": 40 },
  "visibility": "members"
}
```

The first accepted request stores the idempotency key with request hash and response for 30 days. The same key and same hash returns the original response. The same key with a different hash returns `IDEMPOTENCY_KEY_REUSED`. A version mismatch returns `VERSION_CONFLICT` and never performs a last-write-wins update.

## 8. Errors

All errors use `application/problem+json` and include a safe `code`, `request_id`, `correlation_id`, `retryable`, and optional field pointers. They never echo tokens, secrets, raw evidence, or hidden account existence.

| HTTP | Code | Meaning |
|---:|---|---|
| 400 | `INVALID_REQUEST` | Schema or invariant failed. |
| 401 | `TOKEN_INVALID` | Signature, issuer, audience, expiry, nonce, or binding failed. |
| 403 | `CONSENT_REQUIRED` | No active grant covers the field/purpose/destination. |
| 403 | `SCOPE_INSUFFICIENT` | Token lacks the exact operation. |
| 404 | `RESOURCE_NOT_FOUND` | Resource absent or intentionally undisclosed. |
| 409 | `VERSION_CONFLICT` | `If-Match`/expected version is stale. |
| 409 | `IDENTITY_COLLISION_REVIEW` | A possible identity collision requires reviewed linking. |
| 409 | `IDEMPOTENCY_KEY_REUSED` | Same key was used for a different request. |
| 410 | `CONSENT_REVOKED` | Grant was withdrawn and projection may no longer be used. |
| 422 | `FIELD_NOT_SHAREABLE` | Field is outside the approved dictionary. |
| 429 | `RATE_LIMITED` | Retry after the supplied delay with jitter. |
| 503 | `SOURCE_UNAVAILABLE` | Owner cannot safely answer; consumer must not guess. |

## 9. Conflict rules

1. The owner wins for source-owned fields.
2. A consumer with a newer local edit to a source-owned field creates a conflict record; it does not push silently.
3. Immutable identifier conflicts are quarantined for owner review.
4. Expected-version/ETag is mandatory for mutable writes. Last-write-wins is prohibited for identity, consent, membership, price, stock, reservation, custody, and fulfillment status.
5. Timestamps are evidence, not ordering authority. Source version controls ordering; `(source, aggregate_id, sequence)` must be monotonic.
6. A delete/unpublish event wins over an older publish/update event.
7. Conflicts retain both source references, hashes, versions, decision, reviewer, and time without duplicating sensitive payloads in logs.

## 10. Audit events

Required event names include:

- `identity.link.requested|approved|rejected|unlinked`
- `consent.granted|renewed|revoked|expired`
- `profile.read|projection.updated|projection.purged|conflict.detected|conflict.resolved`
- `catalog.projected|updated|unpublished`
- `reservation.requested|accepted|rejected|expired|released`
- `custody.received|condition.changed|packed|dispatched|returned`
- `inventory.reconciled|adjustment.requested|adjustment.applied`
- `webhook.delivered|retry_scheduled|dead_lettered|replayed`

Audit payloads contain actor type/ID, source, target, purpose, scope, consent ID, request/correlation/event IDs, result, reason code, IP-derived security metadata if approved, and payload hash. They exclude tokens, secrets, full contact values, evidence files, message bodies, and full catalog/customer payloads.

## 11. Webhook and outbox contract

Each owner writes the domain change and outbox row in one local transaction. Delivery is at least once; consumers provide exactly-once effects with `event_id` and aggregate sequence.

Envelope fields: `event_id`, `event_type`, `occurred_at`, `producer`, `environment`, `schema_version`, `aggregate_type`, `aggregate_id`, `aggregate_version`, `sequence`, `correlation_id`, `causation_id`, `subject` when consented, `consent_id` when applicable, `data`, and `data_classification`.

Delivery requirements:

- HTTPS only; exact destination allowlist; per-client signing key; timestamp and body digest in the signature.
- Reject signatures older than five minutes and previously accepted event IDs.
- Acknowledge with 2xx only after durable inbox persistence.
- Retry 10 seconds, 1 minute, 5 minutes, 30 minutes, 2 hours, 8 hours, then daily for three days, always with jitter.
- `400/401/403/404/422` are non-retryable after one controlled verification; `408/409/425/429/5xx` follow policy and `Retry-After`.
- Dead-letter after exhaustion. Replay requires an authorized operator, reason, and audit event.

Daily reconciliation compares source high-water marks, event counts, missing sequences, projection versions, unpublish backlog, and unresolved dead letters. It does not compare or overwrite independent stock totals.

## 12. MarketplacePH catalog and inventory boundary

### 12.1 MarketplacePH authority

MarketplacePH owns listing/SKU identity, titles/descriptions, images, categories, variants, commercial price, currency, tax/discount presentation, publication state, store identity, and sellable-stock total/version.

NegosyoDepot may store a read-only catalog projection with source ID/version/freshness. Create, edit, price, publish, unpublish, restock, checkout, refund, and consumer-order changes hand off to MarketplacePH.

### 12.2 NegosyoDepot authority

NegosyoDepot owns fulfillment requests and operational ledgers for reservation request, allocation to a hub/provider, custody receipt, condition, in-transit quantity, packing, dispatch, return, exception, and reconciliation. These quantities describe operational state and never claim to be MarketplacePH sellable stock.

### 12.3 Catalog projection

Every projection carries `listing_id`, `sku_id`, `catalog_version`, `price_version`, `inventory_version`, `publication_state`, `source_updated_at`, `projected_at`, and `fresh_until`. Images remain MarketplacePH URLs or approved immutable asset references; NegosyoDepot does not silently copy and re-own them.

Unpublished or deleted-at-source SKUs are immediately hidden. Historical workflows keep only an immutable snapshot required to explain the transaction.

### 12.4 Price snapshots

MarketplacePH returns current `{amount_minor, currency, price_version, effective_at}`. A reservation/fulfillment request stores this as `price_snapshot` plus capture time. The snapshot is not a promise to the customer unless MarketplacePH accepts it under its order rules. A later price change does not mutate historical snapshots.

### 12.5 Stock and reservation concurrency

1. NegosyoDepot reads a short-lived MarketplacePH snapshot with `inventory_version`.
2. NegosyoDepot creates its local reservation as `pending_source_acceptance` and submits `reservation_id`, `sku_id`, quantity, expiry, and `expected_inventory_version` with an idempotency key.
3. MarketplacePH atomically validates publication, quantity, expiry, and expected version against its sellable-stock ledger.
4. MarketplacePH returns `accepted` with a new authoritative inventory version, or `rejected` with a reason and current version.
5. Only `accepted` reservations proceed to allocation. A pending request is never shown as guaranteed stock.
6. Release, expiry, cancellation, return-to-sellable, and damage are new idempotent events. Neither app edits old events or applies a negative event twice.

NegosyoDepot may calculate operational views from its custody ledger, but may not compute or publish MarketplacePH available-to-sell as its own total.

### 12.6 Stock events

MarketplacePH emits `marketplace.inventory.version_changed` with SKU, prior/new version, reason code, and bounded snapshot or delta as approved. NegosyoDepot emits operational events such as `negosyo.custody.received`, `negosyo.stock.condition_changed`, and `negosyo.fulfillment.dispatched`. MarketplacePH decides how an accepted operational event affects its authoritative sellable stock.

### 12.7 Outage behavior

- If MarketplacePH is unavailable, NegosyoDepot may save a request as `pending_connection`; it cannot promise, allocate, or display confirmed availability.
- Pending requests have a short owner-approved expiry and are replayed with the original idempotency key.
- If NegosyoDepot is unavailable, MarketplacePH continues owning sellable stock and consumer ordering. It queues bounded fulfillment events in its outbox.
- Stale catalog or stock is labelled unavailable for confirmation after its TTL. There is no offline decrement against an independently cached total.
- Recovery starts with event/high-water reconciliation before accepting new cross-app reservations.

### 12.8 Compensating adjustments

Corrections are append-only:

- wrong quantity: `inventory.adjustment.requested` then owner-approved `inventory.adjustment.applied`;
- damaged/lost: condition event plus MarketplacePH disposition decision;
- duplicate event: inbox marks duplicate with no second effect;
- missed event: replay original event ID, never create an artificial replacement unless the owner issues a documented compensation;
- version gap: pause aggregate processing, fetch source projection/event range, verify, then resume.

Every compensation references the original event, reason code, actor/reviewer, evidence reference, and resulting versions.

## 13. Versioning and compatibility

- URI major version: `/ecosystem/v1`.
- Schema uses semantic versions. Additive optional fields increment minor; clarification/fix increments patch; removal, type change, meaning change, or stricter required field requires a new major version.
- Consumers ignore unknown optional fields but reject unknown enum values when they affect money, stock, consent, identity, or status transitions.
- Producers publish deprecation at least 90 days before disabling a minor-version field, subject to owner approval.
- Webhook subscriptions declare accepted schema ranges. Unsupported versions return `SCHEMA_VERSION_UNSUPPORTED` and are not silently coerced.

## 14. Approval and implementation gates

Before implementation, obtain recorded approval for:

- identifier issuer and account-collision recovery;
- field dictionary, purpose, visibility, and retention schedule;
- exact consent text and withdrawal journey;
- scopes, audiences, client ownership, redirect URIs, webhook destinations and secret rotation;
- source API rate limits, SLAs, outage behavior and reconciliation operator;
- catalog price and inventory transition rules;
- privacy impact assessment, security threat model and data-processing responsibilities;
- synthetic staging test plan and rollback.

Required sign-offs:

| Review | Owner | Decision | Date | Notes |
|---|---|---|---|---|
| FLAME PH product/identity owner | Unassigned | Pending | — | — |
| NegosyoDepot product/operations owner | Unassigned | Pending | — | — |
| MarketplacePH catalog/order owner | Unassigned | Pending | — | — |
| Privacy reviewer/DPO | Unassigned | Pending | — | — |
| Security reviewer | Unassigned | Pending | — | — |

Until all required decisions are approved, profile-sync UI, production credentials, database migrations, webhook subscriptions, live-data backfills, and catalog/inventory integration remain disabled.
