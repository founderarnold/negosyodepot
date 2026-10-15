# NegosyoDepot database and integration release plan

Date: 15 October 2026  
Status: schema prepared and syntax-checked; FLAME AI links implemented in source and served bundle. No database has been provisioned or production integration changed.

## Current state confirmed

- The active public app is a static HTML/CSS/JavaScript SPA on Sites. It has no server-side API runtime.
- The Sites project has no D1/R2 bindings, no D1 tables, and no production runtime environment variables.
- Existing sample opportunities/funder offers live in client-side JavaScript. Browser drafts, saves, and comparisons use `localStorage`.
- A separate private `NegosyoDepot Staging` Sites project has been created; it currently has no saved version, deployed code, D1 binding, or database.
- The user confirmed FLAME PH as the intended identity provider, but its OIDC/API specification and client registration details are not available. The user clarified that FLAME AI should be a direct link to `https://flameph.org/bizconsult-ai`; no AI API integration or AI secret is required for this release.
- Desktop and mobile FLAME AI buttons, the homepage shortcut, and the `/ai` route now hand off to that destination. The local page no longer presents a simulated AI assistant. Source files and `dist` copies are synchronized.
- No authoritative production listing/account export, supplier/fulfillment feed, MarketplacePH API contract, or PSGC location source/version has been provided.

## Schema artifact

[`database/migrations/0001_core_schema.sql`](database/migrations/0001_core_schema.sql) creates an empty D1/SQLite-compatible core schema for identities, users, organizations, roles, taxonomies, Philippine locations, typed listings, inquiries, private/public requests, saved listings, comparisons, membership entitlements, moderation, reports, audit events, integration sync state, and import results.

The migration contains no seeds and intentionally includes no sample opportunity or funder data. It uses source-issued identity `(issuer, subject)` keys, carries verification and moderation states separately, defaults listings to draft and requests to private, and keeps provider credentials outside D1. Location rows must come from an authoritative source; none are inserted here.

This SQL has not been applied to a database. The Sites workflow provisions D1 and applies migrations during a deployment after a D1 binding and server runtime are configured. The current static-only manifest cannot serve protected D1 APIs. The private staging project must first receive a supported server runtime (for example the Sites/Vinext Worker pattern), an isolated D1 binding, and this migration; then validate it before attaching any D1 binding to production.

## Proposed source-of-truth mapping

| Data/workflow | Target tables or adapter | Required authoritative input |
|---|---|---|
| Accounts and cross-site identity | `app_users`, `external_identities`, `organization_memberships`, `user_roles`; server-side FLAME PH identity adapter | FLAME PH OIDC/discovery metadata, supported authorization/code flow, client registration, consent model, logout/refresh behavior, and account-linking rules |
| Opportunity and product/service listings | `listings`, `opportunity_details`, `product_service_details`, `listing_locations` | Owner-approved export/API, stable source IDs, field definitions, publication rights, verification meaning, and update/deletion policy |
| Investors, funders, and partner offers | `listings`, `funding_offer_details`, `partner_offer_details`, `organizations` | Provider-submitted or owner-approved data; disclosure and regulatory review rules; no copied demo terms |
| Micro-fulfillment providers and availability | `listings`, `fulfillment_provider_details`, `listing_locations` | Provider register/API and explicit freshness/capacity contract; no inferred availability or prices |
| Philippine administrative locations | `locations` | Approved PSA/PSGC source, license/attribution, source version, and refresh policy |
| Membership benefits | `membership_plans`, `member_entitlements` | FLAME PH membership entitlement API or signed event contract; billing status is not inferred from a profile |
| Inquiries and Looking-for requests | `inquiries`, `looking_for_requests`, `user_reports` | Approved user identity, consent wording, retention/deletion policy, moderation ownership, and notification delivery provider |
| Saves and comparison lists | `saved_listings`, `comparison_sets`, `comparison_set_items` | Signed-in NegosyoDepot identity; preserve browser drafts only with explicit migration/consent |
| FLAME AI | Direct outbound link from every FLAME AI button to `https://flameph.org/bizconsult-ai` | Public destination only; no API credential or conversation data integration |
| MarketplacePH products/orders | No order tables included | MarketplacePH catalog/order API contract and system-of-record owner; avoid duplicate catalog or order databases |
| Imports | `import_batches`, `import_record_results` | Export approval, file schema, stable IDs, deduplication rules, source checksum, and a human-reviewed dry-run |

## Required implementation before live data

1. For FLAME PH identity, obtain its OIDC discovery URL, client registration/redirect URI approval for `www.negosyodepot.com`, supported scopes/claims, account-linking and logout rules, and a test account. Use Authorization Code with PKCE or the provider's documented server-side equivalent; persist only the stable issuer/subject pair.
2. Provision identity credentials through the Sites secret manager. Document key names only; never commit secret values.
3. Select approved sources for listings, investors/funders, suppliers, fulfillment, membership, and locations. Confirm ownership, consent, allowed use, update cadence, stable IDs, and deletion propagation.
4. Implement a server-side API with authentication and role checks on every write. The browser must not receive provider secrets. Public reads must return only published, non-expired, approved records.
5. Implement schema-backed staging import with a dry-run report, duplicate detection, count reconciliation, rejects, and explicit approval before writes. Keep samples marked `source_kind='sample'` and `is_sample=1`; do not import them as live offers.
6. Run schema and workflow checks against isolated staging D1, validate identity with the provider across all three domains, and verify backup/restore and rollback. Review privacy, financial disclosures, security, accessibility, SEO, and performance.
7. Apply an additive migration to production only after staging sign-off and a backup. Confirm table counts, API health, domain behavior, and rollback readiness before declaring launch complete.

## Inputs still needed from the owner

- FLAME PH identity API/OIDC docs and the site's client registration details.
- The authoritative production data source for listings/accounts/membership and its export/API plus field guide. No source was supplied in this turn.
- Any MarketplacePH/fulfillment provider APIs or the confirmation that those records will be submitted and reviewed inside NegosyoDepot.
- Approval of the location dataset/source and applicable content/privacy retention rules.

## Current release gate

**Not ready to apply a production migration or announce launch.** The schema is ready for review, but provisioning it in production would require deploying a server runtime and would change the public Site. The private staging project is still empty, the FLAME PH identity contract is missing, and there is no approved data source to process. FLAME AI is handled by the external link requested by the user.

## Post-signup workspace and PWA follow-up (16 October 2026)

The local application now includes a goal-oriented member workspace, private profile builder/preview, and installable web-app shell. See [`POST-SIGNUP-IMPLEMENTATION.md`](POST-SIGNUP-IMPLEMENTATION.md) for the implementation status and test evidence. Profile API persistence, member directory publication, real auth, messaging and notifications remain dependent on the identity and backend contracts listed above. The additive proposal in `database/migrations/0002_member_profiles.sql` has not been applied; it defaults profiles to private and draft. No staging or production database has been changed.
