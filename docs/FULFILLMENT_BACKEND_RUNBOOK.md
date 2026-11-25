# Fulfillment backend staging and rollback gate

This foundation belongs to a new NegosyoDepot-owned Supabase project. Never apply it to the FLAME PH or MarketplacePH projects.

## Local-only development

The checked-in Supabase configuration uses project ID `negosyodepot-phase1` and an isolated 5732x port range so it can run beside the existing local FLAME PH, MarketplacePH, and POS stacks. It is not linked to a hosted Supabase project.

1. Start Docker Desktop.
2. Run `npm install`.
3. Run `npm run local:supabase:start`.
4. Run `npm run local:supabase:env`. This writes local connection values and a synthetic SSO signing key to the ignored `.env.local`; the command never prints their values.
5. Run `npm run test:db-local` to rebuild the disposable database from migrations and execute the structural and behavioral RLS tests.
6. Run `npm run test:db-contract` for the static migration contract checks.
7. Run `npm run test:fulfillment-local` to verify identity linking, idempotent application creation, and owner listing through the server APIs.

Use only synthetic data locally. `NEXT_PUBLIC_FULFILLMENT_ENABLED=true` belongs only in the ignored local environment. Hosted environments remain disabled until the separate release gate is approved.

To stop only this project, run `npm run local:supabase:stop` from this worktree. Do not stop or reuse another local Supabase project for these tests.

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
