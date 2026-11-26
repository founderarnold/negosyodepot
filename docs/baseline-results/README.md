# Live implementation baseline

- Captured: 2026-11-26T10:17:42.470Z
- Target: https://www.negosyodepot.com
- Verified deployed source commit: `243abf0430d80a1dc5ea12ac74e3826b17bd7fb0`
- Synthetic/test writes: none

## Route and authentication results

| Check | Result |
| --- | --- |
| home `/` | HTTP 200; H1: Find New Opportunities. Grow Together. |
| explore `/#/explore` | HTTP 200; H1: Find your next business opportunity. |
| business finder `/#/find` | HTTP 200; H1: What kind of negosyo fits you? |
| fulfillment `/#/fulfillment` | HTTP 200; H1: Local fulfillment that helps your negosyo move. |
| workspace `/#/dashboard` | HTTP 200; H1: Your next business move starts here. |
| sign in `/#/login` | HTTP 200; H1: Log in |
| privacy `/#/privacy` | HTTP 200; H1: Privacy overview |
| terms `/#/terms` | HTTP 200; H1: Platform terms overview |
| Anonymous session | HTTP 200; signed in: false |
| SSO start | HTTP 307; redirect: https://www.flameph.org/sso/authorize |

## Accessibility and responsive results

- Serious/critical axe violations: 4
- mobile: 4 total axe violation types
- desktop: 4 total axe violation types
- mobile (390×844): 0px horizontal overflow; screenshot: `docs/baseline-results/mobile-fulfillment.png`
- desktop (1440×900): 0px horizontal overflow; screenshot: `docs/baseline-results/desktop-fulfillment.png`
- Unhandled page errors: 0

## Lighthouse results

| Profile | Performance | Accessibility | Best practices | SEO | FCP | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| mobile | 42 | 94 | 96 | 100 | 2657 ms | 20020 ms | 0.000 | 1710 ms |
| desktop | 51 | 94 | 96 | 100 | 1669 ms | 15734 ms | 0.040 | 282 ms |

Raw machine-readable results are in `docs/baseline-results/live-baseline.json`. Lighthouse scores are lab measurements and may vary between runs.
