# FLAME PH identity and member profile build packet

Updated: 16 October 2026  
Status: implementation preparation; waiting for the FLAME PH technical response. No secrets or live member data are included.

## Current evidence

- NegosyoDepot is a static JavaScript/CSS hash-route SPA. The configured deployment directory is `dist/`.
- The existing FLAME PH account CTA points to the public FLAME PH join page. NegosyoDepot has no verified FLAME PH session, callback, identity API, or account database.
- Public FLAME PH pages describe member accounts and digital IDs as live, and the login page offers Google or email sign-in. No public external developer/OIDC documentation or client-registration flow was found. The public Privacy Notice describes Supabase login and Vercel hosting, but this does not establish that an external API or identity integration is available.
- The initial integration request and a detailed follow-up were sent to `flameph.org@gmail.com`; no reply was found when this packet was updated. A technical-owner referral and secure staging-access request were also sent to the public partnerships address, `federationofmsmes@gmail.com`.
- The private `NegosyoDepot Staging` Sites project is owner-only, with no deployment, Worker/runtime, D1 binding, or tables. Production has not been modified.
- A private profile editor exists as a browser-local preview. It must not be treated as a real or shared member record.

## FLAME PH inputs requested

Ask the FLAME PH technical owner to provide or confirm:

1. **Identity protocol:** OIDC discovery URL and issuer, or the supported alternative; supported grant/response type; PKCE and confidential-client requirements; signing algorithms; JWKS URL; audience rules; token lifetime, refresh and revocation behavior; logout endpoint and semantics.
2. **Stable identity claims:** immutable member subject/ID, verified-email claim, display-name claim, and how the FLAME PH member ID and its QR verification status should be consumed. Do not use email as the durable account key.
3. **Scopes and consent:** supported scopes, purpose wording, data-controller/processor roles, permitted claims, account linking, unlinking, deletion, and correction procedures.
4. **Client registration:** exact production and staging redirect URI, post-logout URI, allowed origins, and whether separate clients/credentials are required. Register only the final exact URIs after the staging URL exists.
5. **Test access:** staging issuer/tenant, a non-production test account, and test cases for new member, existing member, unverified email, denied consent, cancelled login, revoked session, and account deletion.
6. **Profile/data API (if FLAME PH is the source of profile fields):** API base URL, version, authorization model, read/write scopes, schemas, pagination/rate limits, field ownership, webhook/event contract, and data freshness/deletion rules.
7. **Operational contact:** owner for integration support, incident notification, credential rotation, and production approval.

Do not email client secrets, access tokens, refresh tokens, private keys, member exports, or personal member records. Put any required credentials directly into the selected Sites secret manager after the protocol and staging client are confirmed.

## Proposed account flow (confirm against provider documentation)

1. Browser starts sign-in at a same-origin NegosyoDepot server endpoint.
2. Server creates and stores state, nonce, and PKCE transaction data, then redirects to the provider's documented authorization endpoint.
3. Provider returns to an exact, registered HTTPS callback. Server validates state, nonce, issuer, audience, signature, expiry, and required verified-identity claims.
4. Server resolves the durable account by `(issuer, subject)`, following documented linking rules. It does not accept a role or user ID supplied by browser form fields.
5. Server creates a short-lived session cookie with `Secure`, `HttpOnly`, and appropriate `SameSite` settings. Provider tokens remain server-side.
6. SPA calls `GET /api/session` for the minimal signed-in member view. Mutations use authenticated same-origin endpoints with CSRF/origin protection and server-side ownership checks.
7. Logout clears the NegosyoDepot session and follows FLAME PH's documented single-site or cross-site logout behavior.

This is a proposed flow, not a claim that FLAME PH supports OIDC. If its identity service does not provide an approved server-verifiable protocol, stop before implementing auth and agree on an alternative with its owner.

## Profile and data behavior

### Member profile

Use `database/migrations/0002_member_profiles.sql` as the starting schema. It is not applied. The profile remains private and draft by default; a public profile needs explicit consent, a moderation decision, and `visibility='public'` before publication. Keep identity/verification status distinct from profile completion and organization verification.

Fields in the current local preview map to the schema as follows:

| Preview field | Storage field | Rule |
|---|---|---|
| display name | `display_name` | Public name is user-controlled; do not expose legal name by default. |
| member type | `profile_type` | Enum validated by server; it grants no role or permissions. |
| business association | `organization_id` | Link only to an organization the signed-in user can manage. |
| industry and base location | `industry`, `location_text` | Public only after consent and review; use the approved location taxonomy when available. |
| business stage and goal | `business_stage`, `primary_goal` | Optional; never treat as eligibility or financial qualification. |
| introduction, offer, need | `introduction`, `offering_summary`, `seeking_summary` | Length-limited, sanitized, moderated before public indexing. |
| contact preference | `contact_preference` | Platform messaging is unavailable until a protected messaging service exists. |
| profile image | `profile_image_key` | Requires private object storage, upload validation, moderation, and deletion support. |

### Other member data

The existing core schema already includes `looking_for_requests`, `saved_listings`, comparison sets/items, inquiries, organizations/memberships, moderation actions, reports, and audit events. Keep request visibility private by default, add account ownership and moderation checks to every write, and do not migrate `localStorage` automatically without an explicit member consent flow.

Messaging and notifications require an abuse/reporting path, recipient controls, retention and deletion rules, delivery provider, preference storage, retries, and audit/support access. Do not show a successful send or match until those services work end to end.

## API contract to implement after the provider contract is received

These are suggested same-origin endpoints. Adjust names/shapes to the actual Sites Worker and provider contract before coding:

| Endpoint | Purpose | Access rule |
|---|---|---|
| `GET /api/session` | Minimal current member and session state | Anonymous request returns signed-out state; no provider token returned. |
| `GET /api/member-profile` | Read own draft/profile | Authenticated owner only. |
| `PUT /api/member-profile` | Create/update own draft profile | Authenticated owner; schema/length checks; server-owned user ID. |
| `POST /api/member-profile/submit` | Request profile review | Authenticated owner; consent timestamp and audit event required. |
| `GET /api/profiles/:publicId` | Read published profile | Return only approved public fields and active published records. |
| `GET/POST/DELETE /api/saved-listings` | Sync saved listings | Authenticated owner; bounded and idempotent writes. |
| `GET/POST/DELETE /api/looking-for` | Own request drafts and reviewed public requests | Private by default; public read excludes private and unapproved records. |
| `POST /api/auth/logout` | End NegosyoDepot session | Clear server session and apply documented provider logout behavior. |

All write endpoints need CSRF/origin checks, per-account/IP rate limits, ownership authorization, structured validation, audit coverage, and privacy-aware errors. Use pagination and bounded responses. Never grant privileged roles from profile form values.

## Staging configuration checklist

- Confirm Sites Worker/runtime model and create/confirm the staging source repository.
- Keep staging owner-only. Verify the project ID and exact staging URL before registering any callback.
- Provision an isolated staging D1 database and bind it only to the staging Worker. Do not bind production D1 or production identity credentials.
- Apply the core migration and `0002_member_profiles.sql` to staging; record migration IDs and schema version.
- Store staging issuer/client values in staging runtime configuration and secrets. Keep production values out of staging.
- Configure the provider's staging redirect and logout URIs only after the staging origin is known.
- Use synthetic test accounts and clearly marked sample listings. Do not copy live member data into staging.
- Validate auth, profile ownership/privacy, publication moderation, request visibility, saves/comparisons, logout/revocation, rate limits, security headers, accessibility, and PWA install behavior on desktop and mobile.
- Verify staging backup/restore and rollback before any production integration review.

## Environment variable names (examples only)

Place values in the platform environment/secret manager, not in this file or committed code. Whether each setting is needed depends on the provider contract:

```text
PUBLIC_APP_ORIGIN=
FLAME_OIDC_ISSUER=
FLAME_OIDC_CLIENT_ID=
FLAME_OIDC_CLIENT_SECRET=   # only if the approved server-side flow requires it
FLAME_OIDC_SCOPES=
FLAME_OIDC_REDIRECT_URI=
FLAME_OIDC_LOGOUT_URI=
SESSION_SIGNING_KEY=        # generated in the platform secret manager
```

Use separate staging and production values. Never place secrets in `dist`, browser JavaScript, URLs, Git, issue comments, or email.

## Completion criteria

The integration can be called complete only after: a real FLAME PH test account signs in and signs out through staging; issuer/subject resolve to one persistent account; account/profile data is owner-scoped; private profiles and requests are not publicly readable; consent and moderation gate publication; user-owned saves and requests sync across devices; unauthorized access and abuse cases are rejected; and the PWA and responsive workflow are visually checked on target browsers. A staging-only success must not be described as production-ready.

## Current handoff

The general FLAME PH contact and partnerships escalation have both been contacted; no response has arrived yet. The code and schema groundwork can proceed against this contract, but provider-specific auth wiring, real profile persistence, staging end-to-end validation, and production launch must wait for the technical owner’s answers and staging client. Public reference pages: `https://www.flameph.org/login`, `https://www.flameph.org/about`, and `https://www.flameph.org/legal/privacy`.
