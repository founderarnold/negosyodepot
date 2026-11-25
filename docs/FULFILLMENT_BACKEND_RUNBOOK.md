# Fulfillment backend staging and rollback gate

This foundation belongs to a new NegosyoDepot-owned Supabase project. Never apply it to the FLAME PH or MarketplacePH projects.

## Before applying the migration

1. Create an isolated staging project with synthetic data only.
2. Record the project reference, region, database version, backup capability, and authorized administrators.
3. Configure the environment-variable names from `.env.example` without committing values.
4. Confirm that `NEXT_PUBLIC_FULFILLMENT_ENABLED` remains `false`.
5. Run `npm run test:db-contract` locally.
6. Review the migration for the target Supabase/PostgreSQL version.

## Staging verification

1. Apply `supabase/migrations/202611260001_fulfillment_foundation.sql` through the approved migration workflow.
2. Run `supabase/tests/fulfillment_foundation_structural.sql`.
3. Add synthetic owner, organization member, reviewer, suspended reviewer, and unrelated-user accounts.
4. Test every RLS policy with each role. Service-role success does not count as an RLS test.
5. Confirm that evidence objects are private, signed links expire, disallowed MIME types fail, and no browser role can delete evidence.
6. Confirm that application owners cannot approve coverage, mark credentials verified, change protected status fields, or read another member's records.
7. Confirm that integration inbox/outbox and audit writes are server-only.
8. Rehearse backup and restore before any production proposal.

## Rollback strategy

The first rollback is operational, not destructive:

1. Keep `NEXT_PUBLIC_FULFILLMENT_ENABLED=false` or turn it off.
2. Stop sync and integration workers.
3. Revoke application service credentials if exposure is suspected.
4. Preserve tables, evidence metadata, audit events, and integration records for investigation.
5. Restore the previous application deployment if the problem is in code.
6. Use compensating records for later operational ledgers; never rewrite or delete historical events.

Do not drop the schema merely to roll back a release. A destructive down migration requires a separate owner-approved maintenance window, a verified backup, a restore rehearsal, and confirmation that no business or audit records must be retained.
