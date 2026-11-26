# Owner and privacy review checklist

Contract: `ph.flame.ecosystem/1.0.0-draft.1`  
Status: Pending; this checklist is not an approval.

## Data minimization and purpose

- [ ] Every shared field has a named owner, destination, purpose, visibility, and retention period.
- [ ] No purpose can be broadened through generic analytics or marketing language.
- [ ] Sensitive evidence, private messages, payment data, job applicants, and live rider location are excluded.
- [ ] Public profile fields are separately selected; private sharing does not imply publication.

## Identity and consent

- [ ] FLAME PH is approved as issuer of immutable subject and organization identifiers.
- [ ] Email linking is compatibility-only and cannot automatically merge distinct people.
- [ ] Consent text is understandable in English and the approved Filipino/Taglish translation.
- [ ] The UI will show field, destination, purpose, visibility, expiry, retention, correction location, and withdrawal consequence.
- [ ] Withdrawal blocks future sharing immediately and starts unpublish/purge processing.
- [ ] Organization authority and individual consent are not confused.

## Individual rights and operations

- [ ] Correction routes return the user to the source owner.
- [ ] Export can identify each source, projection, consent, and app-owned record.
- [ ] Deletion/unpublishing targets and cache propagation are operationally achievable.
- [ ] Legal holds are documented, access-restricted, and never used as a default.
- [ ] Appeals exist for identity collision, review, suspension, and automated matching decisions.

## Security and integration

- [ ] Authorization Code with PKCE, state, nonce, audience, issuer, expiry, and replay tests pass in isolated staging.
- [ ] Credentials are per client, environment, and audience; browser code receives no service key.
- [ ] Webhook signatures, timestamps, replay store, exact destination allowlists, rate limits, and rotation are approved.
- [ ] Logs exclude tokens, secrets, contact values, evidence, messages, and full customer/catalog payloads.
- [ ] Retry, dead-letter, replay, reconciliation, incident response, backup, and restore owners are named.

## Catalog and inventory

- [ ] MarketplacePH remains the sole authority for listing/SKU identity, price, publication, and sellable stock.
- [ ] NegosyoDepot operational quantities cannot appear as an independent sellable-stock total.
- [ ] Reservation acceptance is atomic at MarketplacePH and uses expected inventory version plus idempotency.
- [ ] Price snapshots, stock events, outage state, expiration, return, damage, and compensation rules are approved.
- [ ] No real-money movement is enabled by this contract.

## Sign-off

| Reviewer | Name | Decision | Date | Conditions/evidence |
|---|---|---|---|---|
| FLAME PH product/identity owner |  | Pending |  |  |
| NegosyoDepot product/operations owner |  | Pending |  |  |
| MarketplacePH catalog/order owner |  | Pending |  |  |
| Privacy reviewer/DPO |  | Pending |  |  |
| Security reviewer |  | Pending |  |  |

Implementation remains blocked until required decisions are recorded and the contract version is promoted from draft.
