# ADR 0002: Preserve FLAME PH SSO

- Status: Accepted
- Date: 2026-11-26

## Context

The deployed application uses a browser-bound state and nonce, a one-time ticket, a server-to-server token exchange, a site-specific stable FLAME subject, a signed seven-day NegosyoDepot session, periodic hub checks, and ecosystem logout.

## Decision

Preserve the existing FLAME PH flow and its routes: `/auth/flame/start`, `/auth/flame`, `/api/me`, `/auth/logout`, and `/auth/flame/notice`. Keep secure, HTTP-only, same-site cookies; exact origin allowlists; short-lived state/nonce; no bearer tokens in browser URLs; server-side ticket exchange; stable-subject linking; and coordinated logout.

Email is a verified contact attribute, never the durable identity key. An existing local account is not auto-linked by email. Preview SSO remains disabled until one stable preview hostname and separate credentials are explicitly approved.

## Consequences

Fulfillment adds a local Supabase user only after a valid FLAME session and records `(issuer, subject)` in `ecosystem_identity_links`. Identity conflicts require review. Wildcard Vercel callbacks and production secrets in Preview are prohibited.
