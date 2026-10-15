# Post-signup member experience implementation

Updated: 16 October 2026
Scope: local source and configured static bundle only. No production deployment or account data was changed.

## Delivered in this phase

- Replaced the empty dashboard preview with a goal-oriented workspace: saved/compared counts, private request drafts, profile completion, discovery, readiness resources, and an install entry point.
- Added `/profile`, with entrepreneur/MSME role, business stage, industry, location, goal, introduction, offers, needs, contact preference, live profile preview, completeness indicator, and a browser-local save. It explicitly says the profile is private, local to this device, unverified, and unpublished. External image URLs and file uploads are not accepted.
- Added `/install` with browser-specific guidance for Android, iPhone/iPad, and desktop, plus a real install prompt button when the browser offers `beforeinstallprompt`.
- Added a Web App Manifest, official-brand-derived square launcher icons, service worker and static shell caching. The worker does not cache user profiles, requests, or other private data. The service worker is limited to known same-origin static GETs and falls back to the app shell when offline. Browser-local preview data can remain accessible offline on that same device, does not sync, and can be cleared with browser data.
- Added workspace navigation to the global header and mobile dock, and added profile/install links in the More menu, workspace, and ecosystem/footer area.
- Kept original hash routes, sample listing labels, current local-save keys, legacy navigation routes, and the existing FLAME PH account handoff.
- Added a backend profile schema proposal in `database/migrations/0002_member_profiles.sql`. It defaults to private/draft and requires consent plus public visibility before a record can be published.
- Synchronized the edited source files with the configured `dist` bundle.

## Capability status and blockers

| Capability | Current state | Remaining dependency |
|---|---|---|
| FLAME PH account signup and persistent member identity | Existing handoff to FLAME PH remains; NegosyoDepot does not receive a verified session or member record | FLAME PH OIDC/API documentation, approved client registration and callback, test account, server-side runtime and secret configuration |
| Persistent profile and organization records | Private preview saves in browser localStorage only | Isolated staging D1, authenticated API, role checks, consent/privacy policy, image storage and moderation flow |
| Public/searchable profiles and business pages | Preview only; no public profile route or publish action | Real account ownership, moderation and public read API; approved publication rules |
| Shared requests, saved lists, comparisons | Existing device-local behavior remains | Authenticated account API and consented migration rules |
| Messaging and notifications | Not represented as live features | Message store/API, abuse controls, moderation/support access, notification provider, preferences and retention/deletion policy |
| Installable web app | Manifest, icons, service worker and browser-aware install guidance implemented in local bundle | Validate install eligibility and caching on target browsers after staging publication; app requires network for live content |
| Staging workflow validation | Not completed | `NegosyoDepot Staging` is owner-only but has no deployment, runtime, D1 binding, or tables. It cannot validate account or backend journeys yet. |

The static preview cannot create real accounts, publish to a shared member directory, send or receive messages, deliver alerts, or sync records across devices. Those actions remain unavailable until their server services are connected; no simulated success state was added.

## Validation performed

- `node --check` passed for `app.js`, `redesign.js`, `pwa.js`, and `service-worker.js`. An isolated JavaScript render smoke check confirmed the workspace, profile form, install guide, routes, and preview-only disclosure produce the expected markup.
- Source and deployment copies were synchronized for app, design system, navigation, manifest, install controller, service worker, and icons.
- Read-only Sites inspection confirmed `NegosyoDepot Staging` is custom/owner-only, has no deployment, no D1 binding, and no database tables. The production Site remains publicly configured; it was not changed.
- Browser UI inspection was attempted against a local HTTP server, but the in-app browser rejected localhost navigation (`ERR_BLOCKED_BY_CLIENT`). End-to-end visual, responsive, service-worker and install-prompt checks remain pending in a reachable staging URL.

## Required staging and launch work

1. Obtain the FLAME PH identity contract and provision an isolated staging identity client.
2. Add a supported server runtime and isolated D1 binding to `NegosyoDepot Staging`; apply the schema there only.
3. Implement and verify authenticated profile, organization, draft, request, saved-list and comparison APIs with owner checks, moderation, consent, deletion and audit behavior.
4. Add safe image upload/storage only after validation, ownership and moderation controls are in place.
5. Add messaging, notification delivery and user preferences only after their service owners, abuse controls, retention and privacy terms are agreed.
6. Validate signup, return-to-workspace, profile edit/privacy/publication, listing and request flows on desktop and mobile. Verify PWA install prompts and service worker update/offline behavior in supported browsers.
7. Complete accessibility, security/header, SEO, data-source, backup/restore and rollback reviews in staging before considering production.

The staging database migration has not been applied. Production has not been deployed or modified.
