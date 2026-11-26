# Prompt 1 implementation baseline

Status: **ready for owner review; production unchanged**
Captured: 2026-11-26 (Asia/Manila)

## Exact deployed source and protected work

- `www.negosyodepot.com` resolves to Vercel and returns Vercel deployment headers.
- Live byte hashes for `public/index.html`, `public/auth.js`, and `public/app-fulfillment.js` match Git commit `243abf0430d80a1dc5ea12ac74e3826b17bd7fb0` (`origin/main`) exactly.
- Branch `codex/fulfillment-by-msmes-phase1` was created from that commit. It contains only additive implementation-baseline commits and is not a production branch.
- The branch is pushed to GitHub. Force pushes and deletion are to be disabled by the branch protection rule after this baseline commit is pushed.

The pre-existing canonical worktree remains separately protected at `C:\Users\ManagersPizza\Documents\negosyodepot`. It was not updated, reset, stashed, cleaned, or used for implementation. Its preserved state is:

- branch: local `main`
- HEAD: `4262dbd89ffece1841266b4d06dad3e529b1297f`
- relationship: six commits behind `origin/main` when captured
- uncommitted file: `.gitignore`
- uncommitted change: adds `.env*`
- working-file blob hash: `8c5fce03c958cd0f2c1be4f7adb1b75485a7afa9`

The separate worktree is the preservation boundary. Do not switch, rebase, reset, clean, or delete it as part of this project.

## Isolated environments

### Vercel Preview

- Environment: Preview, not Production
- Source branch: `codex/fulfillment-by-msmes-phase1`
- Verified deployment commit before this documentation commit: `25d5341fff4fa3550ec6bd566f0fd7e0d98db82d`
- Protected preview URL: `https://negosyodepot-git-codex-fulfillment-by-msme-289cf9-founderarnold.vercel.app`
- Anonymous requests are redirected to Vercel authentication.
- An authenticated owner check rendered the Fulfillment by MSMEs route successfully.
- `/api/fulfillment/status` reports `enabled=false`, `databaseConfigured=false`, `signedIn=false`, and `identityLinked=false`.
- No custom production domain is attached to the preview.

### Supabase staging strategy

The owner-approved strategy is local-only Supabase because the current Free organization has no safe third hosted-project slot. The isolated project ID is `negosyodepot-phase1`; its 5732x ports do not overlap the other local Supabase projects. Migrations use synthetic data only. No hosted Supabase project is linked and no hosted migration was applied.

This is acceptable for the implementation baseline, but it is not a production-readiness substitute. Stop before a multi-user or external pilot until a separately owned hosted staging project or an approved Supabase branching capability is available.

## Environment-variable names

Values remain outside Git. Required or reserved names are:

| Purpose | Variable name | Baseline rule |
| --- | --- | --- |
| Supabase browser URL | `NEXT_PUBLIC_SUPABASE_URL` | Local-only value in ignored `.env.local`; absent in Vercel Preview |
| Supabase browser key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Local-only value; never log it |
| Supabase server key | `SUPABASE_SERVICE_ROLE_KEY` | Server-only; never use a `NEXT_PUBLIC_` prefix |
| Fulfillment kill switch | `NEXT_PUBLIC_FULFILLMENT_ENABLED` | `true` locally only; absent/false in Preview and Production |
| NegosyoDepot SSO signing key | `SSO_SECRET_NEGOSYODEPOT` | Server-only; do not add to the current Preview |
| Temporary SSO fallback | `SSO_SECRET` | Deprecated fallback; do not introduce into new environments |
| FLAME profile sync | `FLAME_PROFILE_SYNC_SECRET` | Reserved and unset until an approved server contract exists |
| Marketplace catalog sync | `MARKETPLACE_CATALOG_SYNC_SECRET` | Reserved and unset until an approved server contract exists |
| Integration event signing | `INTEGRATION_EVENT_SIGNING_SECRET` | Reserved and unset until event contracts are approved |
| FLAME Ads feature flag | `NEXT_PUBLIC_FLAME_ADS_ENABLED` | Off by default |
| FLAME Ads API URL | `NEXT_PUBLIC_FLAME_ADS_API_URL` | Public endpoint only |

## Callback and server endpoints

| Purpose | Exact URL or pattern | Rule |
| --- | --- | --- |
| Production SSO callback | `https://www.negosyodepot.com/auth/flame` | Exact allowlist only |
| Production SSO start | `https://www.negosyodepot.com/auth/flame/start` | Same-origin entry point |
| Production logout | `https://www.negosyodepot.com/auth/logout` | Same-origin entry point |
| FLAME PH notice receiver | `https://www.negosyodepot.com/auth/flame/notice` | Signed server-to-server POST only |
| Local callback | `http://127.0.0.1:3000/auth/flame` | Synthetic local testing only; not registered with production identity |
| Vercel Preview callback | none | Preview SSO remains disabled; never wildcard `*.vercel.app` |

If staging SSO is later approved, register one stable owner-only HTTPS hostname and add that exact origin to both the FLAME PH client allowlist and the application allowlist. Do not reuse production credentials.

## Automated baseline

`npm run test:baseline:live` captures the unchanged live site without writes. Results are in [baseline-results/README.md](baseline-results/README.md) with raw JSON and mobile/desktop screenshots.

The captured baseline includes eight routes, anonymous session state, SSO-start redirect destination, mobile and desktop axe checks, horizontal overflow, screenshots, page errors, and Lighthouse performance/accessibility/best-practices/SEO scores. Known baseline risks are recorded rather than hidden: contrast and accessible-name violations exist, and Lighthouse performance is below the release target.

## Stop gates

Stop implementation or deployment if any of these become true:

1. A preview gains a production domain, production Supabase values, or a production SSO secret.
2. The preview becomes publicly accessible before test-data and privacy review.
3. A hosted staging database cannot be separately owned, backed up, restored, and access-reviewed.
4. MarketplacePH or FLAME PH lacks an approved, user-authorized server contract for the proposed handoff.
5. A branch cannot prevent force push/deletion or cannot require review for promotion to `main`.
6. Synthetic data cannot be distinguished from real business or member data.

No production code, DNS, custom domain, Sites publication, production Vercel environment, or hosted Supabase project was changed by this baseline.
