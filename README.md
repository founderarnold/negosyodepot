# NegosyoDepot

NegosyoDepot.com, part of the FLAME PH MSME ecosystem with [flameph.org](https://www.flameph.org) and [MarketplacePH](https://www.marketplaceph.com).

## How it is built

- **`public/`** is the website itself: the plain HTML, CSS and JavaScript app built with Codex (hash routes such as `/#/fulfillment`). It is served exactly as it was on ChatGPT Sites.
- **`app/` and `lib/`** are a small Next.js layer that adds the FLAME PH shared login. NegosyoDepot has no database; the signed-in member is kept in a signed cookie.
- **`original-source/`** holds the older source copies Codex kept at the top of the folder, and **`docs/`** its planning notes. `database/` holds draft database tables that are not in use yet.
- The `live-baseline` tag marks the code as it was last committed in the Codex folder; the commit after it adds Codex's later changes that were not committed there.

## One FLAME PH account

flameph.org is where members sign in and join. Sign in / Sign up buttons go there, and members come back signed in.
On a visitor's first visit the site quietly asks flameph.org whether they are already signed in.
`public/auth.js` sets `window.NegosyoDepotAuth`, which the site's header and pages already read.

| Route | What it does |
| --- | --- |
| `/auth/flame/start` | Sends the visitor to flameph.org to sign in, join, or (with `silent=1`) only check |
| `/auth/flame` | flameph.org sends the visitor back here with a signed token |
| `/auth/logout` | Logs out here and on flameph.org |
| `/api/me` | Who is signed in, for the site's scripts |

It is off until `SSO_SECRET` is set. flameph.org only returns visitors to `www.negosyodepot.com` / `negosyodepot.com`, so login works once the domain points to this deployment.

## Deploy on Vercel

1. Import this repository as a new Vercel project (framework: Next.js; no other settings).
2. Add the environment variable `SSO_SECRET`, with the same value as the flameph-web2 and marketplaceph projects.
3. Check the preview link, then add `negosyodepot.com` and `www.negosyodepot.com` under Settings → Domains and follow Vercel's DNS steps.

```
npm install
SSO_SECRET=<at least 32 characters> npm run dev
```
