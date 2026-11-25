-- Run against the isolated NegosyoDepot staging project after migrations.
-- These tests inspect the deployed catalog and fail the transaction on a missing control.

begin;

do $$
declare
  table_name text;
  required_tables text[] := array[
    'organizations', 'organization_memberships', 'platform_role_assignments',
    'ecosystem_identity_links', 'profile_sync_consents', 'profile_sync_runs',
    'field_sync_conflicts', 'fulfillment_applications',
    'fulfillment_application_status_history', 'application_service_areas',
    'brand_capabilities', 'hub_facilities', 'logistics_capabilities',
    'provider_capabilities', 'application_evidence', 'audit_events',
    'integration_outbox', 'integration_inbox'
  ];
begin
  foreach table_name in array required_tables loop
    if not exists (
      select 1
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = table_name and c.relkind = 'r' and c.relrowsecurity
    ) then
      raise exception 'Missing table or RLS disabled: public.%', table_name;
    end if;
  end loop;
end;
$$;

do $$
begin
  if not exists (
    select 1 from storage.buckets
    where id = 'fulfillment-evidence'
      and public = false
      and file_size_limit = 10485760
  ) then
    raise exception 'Private fulfillment-evidence bucket is missing or misconfigured';
  end if;

  if not exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname = 'fulfillment_evidence_select') then
    raise exception 'Evidence read policy is missing';
  end if;

  if exists (select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects' and cmd = 'DELETE' and policyname like 'fulfillment_evidence%') then
    raise exception 'Evidence bucket must not have a browser delete policy';
  end if;
end;
$$;

do $$
begin
  if has_table_privilege('anon', 'public.fulfillment_applications', 'SELECT') then
    raise exception 'anon unexpectedly has fulfillment application access';
  end if;
  if has_table_privilege('authenticated', 'public.integration_outbox', 'SELECT')
     or has_table_privilege('authenticated', 'public.integration_inbox', 'SELECT') then
    raise exception 'Browser roles unexpectedly have integration queue access';
  end if;
end;
$$;

rollback;
