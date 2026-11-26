# Public route contract

Prompt 2 simplifies discovery without deleting features or renaming URLs. The executable source of truth is `tests/public-route-manifest.mjs`.

## Navigation model

- Primary tasks: Home; Buy or Start a Business; Sell or Pasalo a Business; Buy Franchise; Sell Franchise; Fulfillment by MSMEs; My Workspace.
- More retains secondary destinations, including the B2B Network requested by the owner.
- Contextual subnavigation appears inside business-opportunity, fulfillment, workspace, funding/partnership, and resource/support journeys.
- The legacy fulfillment information pages remain available at their existing hash URLs. They are linked contextually rather than expanded into a global fulfillment mega-menu.

## URL behavior

- Existing hash routes remain unchanged so bookmarks and route-level analytics continue to receive the same path.
- `/#/login` remains the local informational login route when SSO is disabled and retains its intentional handoff to the server-side FLAME PH SSO start route when authentication is enabled.
- `/#/fulfillment` remains an approved compatibility route that renders the Fulfillment by MSMEs overview.
- Direct Next/Vercel requests under `/fulfillment/*` retain the existing redirect to `/#/fulfillmentbymsmes`.
- Direct `/fulfillmentbymsmes/{brands|hubs|logistics|providers}` requests retain their existing journey-preserving redirects.
- No new alias or redirect was added in Prompt 2.

## Automated gate

Run `npm run test:routes`. The test:

1. compares the committed contract against route declarations and sample opportunity IDs;
2. opens every contracted hash route and checks its expected heading without changing the hash path;
3. checks the existing direct redirect behavior;
4. verifies primary and contextual navigation, B2B placement, keyboard operation, visible focus, 44 px targets, browser errors, and horizontal overflow at 320, 390, 820, 1024, and 1440 px.
