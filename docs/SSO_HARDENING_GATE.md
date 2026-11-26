# FLAME PH one-account SSO hardening gate

Date: 2026-11-26  
Status: **STOP — coordinated server-side identity work is required before hardening can be implemented safely**

This is a source and read-only endpoint audit. It changes no production configuration, secret, user, session, or identity mapping. Secret values were not read or recorded.

## Decision

Do not deploy or rotate SSO yet. The three checked applications do not currently implement one compatible protocol:

- FLAME PH and MarketplacePH use a short-lived HMAC bearer token whose durable linking input is verified email. The inspected claims do not include a stable ecosystem `sub`, a one-time `jti`, or a server-side replay record. The inspected authorize/callback flow does not validate a stored state and nonce at both ends.
- MarketplacePH has a server callback and limits its `next` destination, but its callback creates or selects a local account by verified email.
- NegosyoDepot already expects a newer authorization-code-style exchange. It creates browser-bound state and nonce values, requires issuer and audience, expects an immutable `sub`, and stores external identity as `(issuer, subject)`.
- The inspected FLAME PH source, including its deployed-source branch, does not contain the `/api/sso/token` and `/api/sso/status` server interfaces that the NegosyoDepot callback calls. Consequently, the newer NegosyoDepot flow cannot be considered end-to-end compatible or safely linkable.

This meets Prompt 3's mandatory stop condition: an app lacks the server-side exchange and compatible identity mapping required for safe linking.

## Current email compatibility behavior

The older FLAME PH and MarketplacePH path signs a verified email claim and then finds or creates a local Supabase account with that email. This preserves compatibility for existing users, but email must not remain the permanent account key:

- an address can be changed, reassigned, mistyped, or shared;
- a changed address can split one person's ecosystem record;
- the same address can incorrectly merge distinct people;
- verification proves control of an address at a point in time, not permanent identity.

During migration, verified email can be shown as a claim and used to propose a link. It must never silently merge two records.

## Required identity model

FLAME PH should issue an opaque, immutable ecosystem subject identifier. Each client stores the unique pair `(issuer, sub)`. Email, name, phone, membership status, and badges remain changeable claims. The hub must issue short-lived, audience-specific, single-use authorization codes; record their hash, `jti`, client, redirect URI, nonce, issued time, expiry, and consumption time; and reject second use atomically.

Required environment-variable names may be documented, but values remain only in coordinated Vercel settings. Current compatibility names observed in source include `SSO_SECRET`; NegosyoDepot also supports `SSO_SECRET_NEGOSYODEPOT`. The target design should use a different client credential per application and environment, with no production secret copied into preview or staging.

## Safe migration order

1. Create an isolated staging identity environment and synthetic test accounts.
2. Add immutable ecosystem subjects to FLAME PH without changing current sign-in behavior.
3. Add hub-side authorization, one-time token exchange, status, logout, replay storage, audit events, and exact redirect registration.
4. Add nullable `(issuer, subject)` mappings to MarketplacePH. Never auto-merge on email. Existing matches require an authenticated two-sided link or an owner-reviewed migration decision; collisions go to quarantine.
5. Run dual-read/sub-write compatibility in staging. Email remains a display/notification claim only.
6. Upgrade MarketplacePH, then NegosyoDepot, to the same versioned protocol and registered callback contract.
7. Complete the security matrix below with synthetic identities before any production cutover.
8. Coordinate a maintenance window, environment-variable update, and old-token revocation only after all three owners approve.

## Security test matrix

| Case | Present source result | Required acceptance result |
|---|---|---|
| Valid FLAME PH → MarketplacePH login | Legacy email-linked path exists | Link by `(issuer, sub)` and return only to registered route |
| Valid FLAME PH → NegosyoDepot login | Blocked by missing compatible hub token/status interfaces | One-time code exchange succeeds and nonce matches |
| Cancelled login | Not consistently represented as a signed callback result | Safe local error, no account/session, state consumed |
| Expired token/code | Expiry checks exist in inspected signed-token helpers | Reject, log reason, create no session |
| Invalid signature | Signature checks exist | Reject uniformly without sensitive detail |
| Wrong audience | New Negosyo helper checks audience; legacy paths are not the same contract | Reject before mapping or session creation |
| Wrong issuer | New Negosyo helper checks issuer | Reject before mapping or session creation |
| Replay | No compatible cross-app single-use store was found | Second exchange fails atomically |
| Open redirect | Local allowlists/safe-next checks exist in inspected paths | Exact registered origin and path checks at every hop |
| State and nonce | New Negosyo start/callback stores and checks them; legacy flow does not validate both ends | Required, browser-bound, constant-time compared, consumed once |
| Simultaneous sessions | Not demonstrated end to end | Separate browsers remain isolated; logout scope is explicit |
| Local and ecosystem logout | Hub logout routes exist in legacy source | Local session cleared, hub result verified, safe return only |
| Email collision | Legacy behavior can link by email | Never auto-merge; quarantine and reviewed recovery flow |

## Read-only live probe observations

The following anonymous probes were run on 2026-11-26. They did not authenticate, follow a returned credential, or change state:

- NegosyoDepot's live `/auth/flame/start` returned HTTP 307 and included `client`, `return`, `state`, and `nonce` query keys in its handoff. The same route was also tested with an external `next` input; source inspection confirms local-next normalization is applied before the handoff.
- A NegosyoDepot callback with deliberately invalid code and state returned HTTP 307 to the NegosyoDepot origin and did not establish a tested session.
- A MarketplacePH callback with an invalid token and an external `next` input returned HTTP 307 to the MarketplacePH origin.
- FLAME PH rejected an unknown client/external return request with HTTP 400.
- Anonymous silent authorize probes for both MarketplacePH and NegosyoDepot returned HTTP 400. No valid end-to-end session could therefore be established for the security matrix, and the missing/incompatible interface remains a release blocker.

These narrow results do not prove replay safety, simultaneous-session isolation, logout propagation, or correct account linking. Those cases require the isolated synthetic staging setup described above.

## Rollback

- Keep a per-client, server-side feature flag that can stop new SSO starts without deleting mappings or user data.
- Preserve the previous deployment artifact and callback registration until the observation window closes.
- On rollback, disable new code exchange, revoke unconsumed tickets and changed client credentials, clear only sessions created by the failed release where technically distinguishable, and retain audit records.
- Keep legacy email mappings read-only for account recovery analysis; do not resume creating new cross-app links by email.
- Roll back all three clients in the documented compatible order. Do not leave a client on a protocol the hub cannot serve.

## Approval gate

Implementation can resume only after the owners approve: the immutable subject authority, collision-review policy, exact staging and production callback registry, per-client secret ownership, replay-store retention, logout scope, staged rollout order, and rollback operator.
