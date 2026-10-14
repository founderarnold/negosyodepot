# NegosyoDepot security baseline

This site is currently a static, client-rendered prototype. It does not contain a Supabase service key, server routes, file-upload endpoint, payment flow, message database, or daily reminder worker. The controls below are the release gate for enabling those features.

## 1. Website protections

- Serve only over HTTPS. Keep HSTS enabled and retain the dist/_headers policy.
- Keep the CSP restrictive. Add a nonce or hash for any future inline script; do not add unsafe-eval.
- Keep frame-ancestors 'none', X-Content-Type-Options: nosniff, a strict referrer policy, and a least-privilege Permissions Policy.
- Allowlist external origins for fonts, images, APIs, and identity providers. Never interpolate user text into HTML; render user content with textContent or a vetted sanitizer.
- Use a managed WAF/CDN and bot/rate controls before opening the site to public traffic. Add login, signup, inquiry, post, upload, and reminder endpoints to per-IP and per-account limits.
- Keep admin, founder, commissary, payout, and webhook routes out of public navigation and require server-side authorization on every request.

## 2. Supabase database access rules

Enable RLS on every public table and grant the browser only the publishable key. Never expose a secret/service-role key.

| Table | Anonymous | Authenticated member | Owner/admin |
|---|---|---|---|
| profiles | Read only a minimal public profile | Read/update own profile; role fields immutable | Moderation and support workflow |
| organizations | Read approved public fields | Create/update only organizations they own | Verify, suspend, or restore |
| funder_offers | Read approved, non-sensitive offers | Create/update own drafts; submit for review | Approve, reject, archive |
| business_listings | Read approved listings | Create/update own drafts | Moderate and publish |
| inquiries | No access | Insert as sender; read sender/recipient thread | Support access with audit trail |
| documents / storage.objects | No access | Access only through signed URLs and an ownership policy | Malware scan and review |
| referrals / commissions / payouts | No access | Read only the member’s finalized statements | Finance/admin only |
| audit_events | No access | No client writes | Append-only service/admin writes |

Use auth.uid() and server-owned organization membership tables for authorization. Do not trust user_metadata, client-supplied roles, hidden form fields, or an offer's status. For every insert/update, validate ownership and allowed state transitions in a policy or server function. Add database constraints for money amounts, currencies, statuses, timestamps, and foreign keys.

## 3. Server code and special connection points

- Route all sensitive operations through Edge Functions or a controlled server. Validate JSON schema, length, encoding, enum values, and authorization before database calls.
- Use POST/PUT/PATCH/DELETE for mutations and verify Origin/CSRF protections. Make payment, commission, and reminder jobs idempotent with a unique event key.
- Do not accept arbitrary callback URLs, image URLs, webhooks, or server-side fetch targets. Use an HTTPS allowlist to prevent SSRF.
- For uploads, require authentication, allowlist file types, inspect magic bytes, cap size and dimensions, generate filenames, store outside executable paths, virus-scan/CDR where appropriate, and serve through short-lived signed URLs.
- FLAME PH cross-platform SSO must use an approved OAuth/OIDC flow with exact redirect URI allowlists, PKCE, short-lived access tokens, refresh-token rotation, and logout/revocation. Never pass tokens in URL fragments or query strings.
- Daily reminders should run in a private scheduler/Edge Function with a secret, bounded batches, retry backoff, idempotency, and an audit record. Never expose a cron secret in browser code.

## 4. Secrets and dependencies

- Keep API keys, OAuth secrets, database URLs, service keys, webhook secrets, and signing keys in the platform secret manager. Rotate on a schedule and immediately after any suspected exposure.
- Commit only .env.example; .gitignore excludes secret files and archives. Review the repository and deployment logs for accidental credentials before each release.
- Pin dependency versions, run a lockfile audit and a software composition scan, remove unused packages, and review transitive package updates.
- Use separate Supabase projects/credentials for development, staging, and production. Apply least privilege and document who can access each secret.

## 5. Thousands of concurrent users

- Keep the frontend static and cache immutable assets. Put dynamic work behind a CDN/WAF and autoscaled Edge Functions.
- Use Postgres connection pooling, indexes for every common filter, pagination, bounded search, and statement timeouts. Never return unbounded listings, messages, or audit logs.
- Queue email, notifications, document scans, and reminders. Apply backpressure, exponential retries, dead-letter handling, and idempotency keys.
- Add per-account and per-IP quotas for signup, OTP, login, inquiries, uploads, offer posts, and password reset. Monitor latency, error rate, database saturation, queue depth, auth abuse, and unusual exports.
- Test load and failure modes in staging with synthetic accounts. Run backup/restore drills and keep an incident response and account-compromise procedure.

## Release gate

Before enabling real accounts, payments, investments, lending, uploads, or messaging, run Supabase Security Advisor, RLS tests for anonymous/member/owner/admin roles, dependency and secret scans, CSP/header checks, authenticated endpoint abuse tests, and a legal/privacy review.
