# NegosyoDepot existing-site audit

Audit date: 15 October 2026  
Scope: repository contents and configured static deployment in `site-source/`. No production system was accessed or changed.

## Executive summary

This repository contains a static, client-rendered NegosyoDepot preview with a hash-based router. It is not a Next.js, Supabase, PHP, WordPress, or Shopify application. The hosting manifest at `site-source/.openai/hosting.json` selects `site-source/dist` as the static deployment directory. Its entry page loads `app-fulfillment.js`, `styles-fulfillment.css`, and `extras-fulfillment.js`.

The main application code in `site-source/app.js` is byte-identical to the deployed `site-source/dist/app-fulfillment.js`. However, the source-root `index.html` references `styles-fulfillment.css` and `app-fulfillment.js`, neither of which exists at that level; source-root `styles.css` is an older, separate stylesheet. The deployment copy in `dist` is therefore the functioning build target, while the source-root HTML and CSS are stale. There is no build script, package manifest, framework configuration, database schema, migration, API server, or configured external application connector in the repository.

The current pages provide a meaningful navigable preview and explicit disclosure for several unfinished workflows. They do not provide persistent shared accounts, shared listing data, messaging, payments, operational fulfillment, investor applications, or a live AI service. Sample opportunities, offers, and statuses are client-side demo content and must not be represented as live inventory or verified businesses.

## Repository and deployment inventory

| Area | Observed implementation | Preservation note |
|---|---|---|
| Runtime | Plain HTML, CSS, JavaScript; hash-based single-page routing | Continue from existing code unless a separately approved migration plan justifies another stack. |
| Hosting | `.openai/hosting.json` serves `dist/`; `dist/_headers` sets response headers | Production host, DNS, staging, backups, and rollback access are not available in this repository. |
| Application | `app.js` (113 KB) corresponds exactly to served `dist/app-fulfillment.js`; an additional `dist/app.js` bundle also exists | Preserve both existing page logic and supplied versioned artifacts until their ownership and release history are confirmed. |
| Styles | `dist/styles-fulfillment.css` is the stylesheet used by the deployed HTML; source-root `styles.css` is a separate older design | Deployment-target stylesheet must be treated as the rendered baseline. Keep legacy source until the intended source/build workflow is consolidated. |
| Additional page logic | `extras.js` corresponds to `dist/extras-fulfillment.js` and adds FAQ, Looking for, and homepage content | Preserve these pages and explicitly disclosed local-only storage behavior. |
| Images and brand | `assets/negosyodepot-logo.png`, `assets/negosyodepot-mark.png` | Official NegosyoDepot assets exist. No FLAME PH logo or screenshot source image is present in this repository. |
| Data | Small hard-coded sample opportunity and sample funder offer arrays; browser `localStorage` for saves, comparisons, and drafts | No production catalog, supplier records, user directory, or database is included. Never interpret demo entries as verified/live. |
| Accounts | UI for email/mobile/Google sign-in; simulated state and integration-required dialogs | No working identity provider, password store, OTP delivery, session backend, or cross-domain SSO configuration found. |
| APIs/integrations | External links to FLAME PH AI, MarketplacePH, Google Fonts, and public guidance; no backend API client found | Links do not demonstrate authentication or data integration. Verify external systems with their owners before connecting. |
| Security guidance | `SECURITY.md`, plus static headers in `dist/_headers` | The security document describes planned controls and a future release gate; it is not proof those services or controls exist. |
| Archive artifacts | Multiple untracked `.tar` site variants and project prompt documents | Keep as historical/reference material. No archive was unpacked over the working tree. |
| Version control | `.git` exists but current `master` has no commits | No committed baseline or rollback commit is available. Existing untracked work must be preserved. |

## Existing route and page inventory

The SPA's route-name map declares these primary routes:

`/`, `/explore`, `/find`, `/compare`, `/grow`, `/scale`, `/sell-business`, `/funder-finder`, `/investor-funder`, `/fulfillment`, `/partners`, `/membership`, `/ai`, `/post`, `/dashboard`, `/login`, `/resources`, `/ecosystem`, `/trust`, `/privacy`, `/terms`, `/contact`, `/faq`, `/looking-for`.

Fulfillment submenu and detail routes declared in the application include:

`/fulfillment/start`, `/fulfillment/provider-register`, `/fulfillment/provider-list`, `/fulfillment/order-fulfillment`, `/fulfillment/partner-onboarding`, `/fulfillment/incentives`, `/fulfillment/pricing`, `/fulfillment/costs`, `/fulfillment/cost-estimator`, `/fulfillment/optional-services`, `/fulfillment/quote-checklist`, `/fulfillment/brand-profile`, `/fulfillment/catalog`, `/fulfillment/brand-growth`, `/fulfillment/trust`, `/fulfillment/brand-protection`, `/fulfillment/network`, `/fulfillment/self-fulfill`, `/fulfillment/providers`, `/fulfillment/b2b`, `/fulfillment/global`, `/fulfillment/marketing`, `/fulfillment/academy`, `/fulfillment/guides`, `/fulfillment/stories`, `/fulfillment/blog`, `/fulfillment/online-selling`, `/fulfillment/export-readiness`.

Dynamic opportunity details use `/opportunity/:id`. Several secondary paths are supported by generic information-page handling rather than a dedicated data-backed module. Route declaration alone does not prove that a route has complete content or a working backend workflow.

## Feature-preservation matrix

| Existing feature | Existing URL/module | Current behavior | New destination | Migration status |
|---|---|---|---|---|
| Home and opportunity discovery | `/`, `/explore`, `/opportunity/:id` | Homepage, filters, and details use a small hard-coded sample catalog | Home; Opportunities; opportunity detail | Presentational preview only; retain UI and replace data source only after real catalog access is available. |
| Business finder and comparisons | `/find`, `/compare` | Preference form filters demo listings; saved/compared IDs use browser storage | Opportunities; account workspace | Local preview; no server-side matching or saved account state. |
| Local growth and global readiness | `/grow`, `/scale` | Guidance pages with links/content | Opportunities; Micro-fulfillment; Learn & Support | Content-led; preserve and map guidance. |
| Sell a business and funder finder | `/sell-business`, `/funder-finder` | Guidance and client-side pitch preparation | Opportunities; Investors & Funders; account workspace | Draft-only; no submission or funder database. |
| Investor/funder offers and mini-page | `/investor-funder` | Example offers; offer form saves browser-local draft; landing-page form creates an in-browser preview | Investors & Funders; public profiles | Sample content/editor preview; no moderation, persistence, or publication. |
| Fulfillment overview and provider directory | `/fulfillment`, `/fulfillment/providers` | Explanatory directory and service discovery content | Micro-fulfillment | No registered provider dataset or search API found. |
| Fulfillment operations, onboarding, pricing, brand and learning guides | `/fulfillment/*` routes above | Guides, registration information, estimate/calculator and supporting content | Micro-fulfillment; Learn & Support | Preserve each route; distinguish educational content from operational transaction processing. |
| Corporate Partner program | `/partners` | Program information and proposed process | Partners | No connected corporate accounts, referral attribution, or commission ledger found. |
| Membership/VIP benefits | `/membership` | Membership tiers and allowance presentation | Account; Membership | UI/configuration content only; no billing/subscription service or member entitlement data found. |
| FLAME AI | `/ai`; all FLAME AI buttons link to `https://flameph.org/bizconsult-ai` | FLAME AI header buttons and homepage shortcut open the external FLAME PH destination in a new tab; `/ai` is an informational handoff page | FLAME AI | No local AI responses or API integration. |
| Account, sign-in and dashboard | `/login`, `/dashboard` | Forms/UI with integration-required messaging and simulated state | Account menu; user workspace | No real authentication, role enforcement, or user database found. |
| Post a business | `/post` | Client-side form gates on sign-in/integration notice | Opportunities; Products & Services; account workspace | No listing submission endpoint, review queue, or persistence found. |
| Looking for requests | `/looking-for` | Create/read/delete private drafts in browser `localStorage` | Opportunities; Partners; Investors & Funders | Local-only feature; retain disclosure and data behavior until shared request service exists. |
| Trust, FAQs, contact, privacy, terms, resources | `/trust`, `/faq`, `/contact`, `/privacy`, `/terms`, `/resources` | Static guidance/content | Learn & Support; Company/footer | Preserve route access and review copy/ownership before changing policy text. |
| Ecosystem links | `/ecosystem`; footer outbound links | FLAME PH and MarketplacePH external navigation and “under construction” notice | Shared footer/ecosystem banner | Links exist; no unified-account or catalog integration is evidenced. |
| Saved items | cards and `localStorage` (`nd_saved`) | Browser-local saved listing IDs | Account workspace | Local-only; retain or migrate only with user/account ownership and a real backend. |
| Comparison state | `/compare`, `localStorage` (`nd_compare`) | Browser-local listing IDs | Opportunities/account workspace | Local-only. |
| Offer and request drafts | `localStorage` keys `nd_funder_offer_draft`, `nd_looking_for` | Browser-local drafts | Relevant account workspace | Local-only; no server persistence or sharing. |
| Administration/moderation | None identified | No admin route, server, or moderator workflow in repository | Administration | Not implemented in audited code. |
| Supplier/product catalog, orders, payments, messaging, notifications | None identified | No such data model or service found | Products & Services; account workspace | No existing implementation/data to migrate from this repository; external systems require owner confirmation. |

## Accounts, data, and integrations

- No database schema, migration history, database credentials/configuration, or production dump is present.
- No account records, password hashes, roles, payment records, fulfillment tasks, orders, or private messages are present in the repository.
- `localStorage` is browser- and device-specific. It does not create a unified account or synchronize data.
- UI text naming a “FLAMEPH Member ID” and project prompts describing Supabase are future requirements, not evidence of an active identity provider.
- Google sign-in, email/mobile OTP, and SSO are not connected in the inspected application code.
- The project links to MarketplacePH and FLAME PH, but has no verified API, OAuth/OIDC client, webhook, shared catalog, or cross-platform session integration.
- No live domain, hosting dashboard, source-control remote, analytics account, CMS, or registrar configuration was available to inspect in the workspace.

## Design and implementation baseline

- Existing official NegosyoDepot logo and mark should be reused without modification.
- Existing UI uses responsive CSS, mega menus, a mobile menu, a mobile navigation dock, cards, forms, dialogs, a footer, and fulfillment-specific templates.
- The target screenshot adds dual FLAME PH/NegosyoDepot branding and a compact business-focused hero with five feature shortcuts, five core feature cards, ecosystem banner, and mobile-first feature grid. No FLAME PH logo asset is currently available in the repository.
- The proposed project-level prompt's Next.js/Supabase/Vercel target conflicts with the actual static hosting setup. The implementation should extend the current platform during this phase; a framework/backend migration requires an evidence-based plan, account/data access, and a separately staged integration.

## Risks and dependencies

1. **Build/source drift:** source-root HTML/CSS do not describe the configured served build. Consolidate the editing path and verify the deploy directory after each implementation phase.
2. **Uncommitted baseline:** repository has no commits. Preserve all supplied untracked artifacts; establish a deliberate baseline/rollback point before any production release.
3. **Production scope unknown:** the repository cannot establish which features, records, accounts, integrations, URLs, or plugins exist on the current public website. Obtain read-only access or exports before planning live migration.
4. **Demo content:** opportunity and funder examples are static sample data. Do not pass them off as current, verified offers.
5. **Authentication and finance:** no SSO, transaction, lending, investment, or commission workflow is implemented. These need backend design and qualified owner/compliance review.
6. **Asset gap:** FLAME PH branding and the provided design reference are not in project assets; only the screenshot attachment is available in this task context.

## Phase 1 exit and scope limit

The repository-level inventory and feature-preservation map are complete. The audit cannot certify the live site's database, accounts, hosting integrations, or production feature set because no production access or export was supplied. Before any live-data migration, reconcile this inventory against read-only production access and an owner-provided data/integration inventory.

## Phase 2 implementation record

- Added `design-system.css` with centrally defined blue/green palette, typography and layout rules, reusable cards, responsive breakpoints, mobile-safe navigation, reduced-motion support, and phone-bottom navigation styling.
- Added `redesign.js` to present the FLAME PH and NegosyoDepot identities together, reorganize the global navigation into the reference's primary sections, retain all existing route links in “More,” and restyle the homepage hero and five business-engine cards around the screenshot hierarchy.
- Added the blue-to-green ecosystem integration band ahead of the existing shared footer; existing footer links and the MarketplacePH construction notice remain available.
- Updated both entry pages to load the correct local assets and versioned redesign files. The configured `dist` entry remains the deployment target; corresponding new design and navigation files are copied to `dist`.
- Preserved the existing homepage opportunity, budget, category, investor, learning, and fulfillment sections; existing route/page renderers; browser-local saves and drafts; account and AI integration disclosures; and footer destinations.
- Fixed the Explore filter refresh recursion by binding actions to the refreshed opportunity cards instead of recursively rebinding the entire page.
- Browser smoke checks passed for home, opportunity search/filter, fulfillment directory, investor/funder, partner program, FAQ, and sign-in sections. Search for “coffee” returns one matching sample listing without a browser runtime error. Desktop 1440 px viewport had no horizontal overflow. Phone 390 px viewport had a two-column engine-card grid, five-item dock, no document overflow, and a working More menu without document overflow.
- Saved the supplied rebuild prompt as the project-level instruction and copied the screenshot into `site-source/design-reference/` for future module work.

## Navigation destination map

| New visible destination | Existing routes retained |
|---|---|
| Home | `/` |
| Opportunities | `/explore`, `/find`, `/compare`, `/sell-business`, `/grow`, `/scale`, `/post`, `/opportunity/:id` |
| Products & Services | `/explore`, `/fulfillment/catalog`, `/fulfillment/brand-profile`, `/fulfillment/providers`; outbound MarketplacePH link |
| Investors & Funders | `/investor-funder`, `/funder-finder` |
| Partners | `/partners`; fulfillment provider and partner onboarding routes under More |
| FLAME AI | Outbound `https://flameph.org/bizconsult-ai`; local informational assistant retained at `/ai` under More |
| More | Remaining declared primary routes and all legacy fulfillment, learning, trust, company, account, and policy routes |
| Mobile quick navigation | Home `/`, Opportunities `/explore`, Products MarketplacePH link, Investors `/investor-funder`, More opens the full navigation |

The source tree still has no automated build configuration and the host serves a copied static `dist` directory. Source and served files must be kept synchronized until that release process is consolidated. This phase made local development and the configured static bundle use the new layout; it did not deploy to production.

## Remaining launch dependencies

- Obtain read-only access or owner exports for live pages/URLs, database, listings, users, membership, plug-ins, integrations, analytics, SEO and redirects.
- Confirm authoritative FLAME PH, MarketplacePH, hosting, identity, and AI systems with their operators.
- Set up staging and a committed baseline or another tested rollback snapshot before production work. The repository has no committed history and no staging/production credentials were available.
- Implement backend-backed accounts, listings, messaging, moderation, product catalog, fulfillment operations, investor/funder publication, and AI retrieval before enabling those workflows. Current previews must remain clearly identified as previews.
- Review financial offer disclosures, privacy, security, accessibility, performance, SEO, and data migration in a controlled staging environment before launch.

Do not deploy, change DNS, delete data, or imply that mock workflows are live.

## Managed Sites production-state follow-up (15 October 2026)

A read-only inspection through the connected Sites service confirmed the hosting state that was not visible during the original repository-only audit:

| Check | Observed state | Launch implication |
|---|---|---|
| Site project | `NegosyoDepot`, active; current user is the project owner | The project is accessible through the Sites connector. The earlier statement that no deployment access was available is superseded. |
| Public URL | `https://www.negosyodepot.com` | The requested domain is already attached to this Site. |
| Custom domain and TLS | `www.negosyodepot.com` is active; provider and SSL statuses are active | DNS/domain setup is already complete; no DNS change is needed for this release. |
| Current published version | Version 14, commit `590ddc83a509c0acd35309d330bf50678efa063d`; latest deployment status `succeeded` | This is a recoverable production baseline in Sites version history. The nested `site-source` Git repository has the matching short commit at `HEAD` (`590ddc8`). |
| Current local checkout | Branch `main` at `590ddc8`; redesign edits and audit/design artifacts remain uncommitted; no Git remote is configured in the local checkout | Do not represent current local edits as published. Use the Sites source workflow to bind/push the exact release commit before saving a Site version. |
| Site database | No D1 bindings and no tables returned by the Sites database overview | This confirms there is no Site-managed database in this project; it does not rule out external data held by other operators. |
| Production runtime configuration | No Site runtime environment variables are configured (revision 0) | No production API, identity-provider, or AI credentials are configured through this Site. This does not rule out separately managed services, but none were evidenced in the inspected source or Site project. |
| Staging | A separate private Sites project, `NegosyoDepot Staging`, was provisioned on 15 October 2026. It has no saved versions, deployment, preview URL, D1 binding, or database yet. Sites deployment calls produce production URLs, so a deployment to this stage must remain private and isolated from the production custom domain. | The staging project exists but is not yet a validated staging environment. The production release has not been validated there. |

The public application remains a static preview with sample listings and browser-local drafts. The Sites inspection confirms hosting and rollback history, but it does not supply audited live listing/account exports, an identity-provider configuration, or operational fulfillment integrations. FLAME AI is linked directly to FLAME PH as requested; no local AI service is part of the release. Production deployment remains gated on resolving the remaining application/data dependencies and staging validation; the current production version was not changed during this follow-up.
