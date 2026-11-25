-- Behavioral RLS smoke tests for a disposable database only.
-- Run after bootstrap_supabase_catalog.sql and the fulfillment migration.

begin;

insert into auth.users (id, email) values
  ('11111111-1111-4111-8111-111111111111', 'owner1@example.invalid'),
  ('22222222-2222-4222-8222-222222222222', 'owner2@example.invalid'),
  ('33333333-3333-4333-8333-333333333333', 'reviewer@example.invalid');

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

insert into public.organizations (id, created_by, display_name, organization_type)
values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', auth.uid(), 'Owner One Brand', 'brand');

insert into public.fulfillment_applications
  (id, created_by, organization_id, role, idempotency_key)
values
  ('a1111111-1111-4111-8111-111111111111', auth.uid(), 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'brand_owner', 'owner-1-draft');

insert into public.brand_capabilities (application_id, product_categories)
values ('a1111111-1111-4111-8111-111111111111', array['Packaged food']);

insert into public.application_service_areas
  (id, application_id, coverage_level, area_name, source_name, source_version)
values
  ('aa111111-1111-4111-8111-111111111111', 'a1111111-1111-4111-8111-111111111111', 'city_municipality', 'Quezon City', 'PSGC', 'test');

insert into storage.objects (id, bucket_id, name, owner_id)
values (
  'ea111111-1111-4111-8111-111111111111',
  'fulfillment-evidence',
  '11111111-1111-4111-8111-111111111111/a1111111-1111-4111-8111-111111111111/sample.pdf',
  auth.uid()::text
);

do $$
begin
  begin
    update public.fulfillment_applications
      set status = 'approved_for_pilot'
      where id = 'a1111111-1111-4111-8111-111111111111';
    raise exception 'owner_status_change_was_not_blocked';
  exception
    when others then
      if sqlerrm = 'owner_status_change_was_not_blocked' then raise; end if;
  end;

  begin
    update public.application_service_areas
      set approved = true, approved_at = now(), approved_by = auth.uid()
      where id = 'aa111111-1111-4111-8111-111111111111';
    raise exception 'owner_coverage_approval_was_not_blocked';
  exception
    when others then
      if sqlerrm = 'owner_coverage_approval_was_not_blocked' then raise; end if;
  end;

  begin
    insert into public.hub_facilities
      (application_id, facility_control, public_location)
    values
      ('a1111111-1111-4111-8111-111111111111', 'owned', 'Quezon City');
    raise exception 'wrong_role_capability_was_not_blocked';
  exception
    when others then
      if sqlerrm = 'wrong_role_capability_was_not_blocked' then raise; end if;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', true);

insert into public.fulfillment_applications
  (id, created_by, role, idempotency_key)
values
  ('a2222222-2222-4222-8222-222222222222', auth.uid(), 'hub_operator', 'owner-2-draft');

do $$
begin
  if (select count(*) from public.fulfillment_applications) <> 1 then
    raise exception 'owner can see another owner application';
  end if;
  if exists (select 1 from storage.objects where id = 'ea111111-1111-4111-8111-111111111111') then
    raise exception 'unrelated user can see private evidence';
  end if;
end;
$$;

reset role;

set local role service_role;
select (public.create_fulfillment_application(
  '11111111-1111-4111-8111-111111111111',
  'brand_owner',
  'owner-1-rpc-draft-0001',
  'c1111111-1111-4111-8111-111111111111',
  'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
)).id;
reset role;

do $$
declare
  rpc_application_id uuid;
begin
  select id into rpc_application_id
  from public.fulfillment_applications
  where created_by = '11111111-1111-4111-8111-111111111111'
    and idempotency_key = 'owner-1-rpc-draft-0001';
  if rpc_application_id is null then
    raise exception 'server application RPC did not create a record';
  end if;
  if not exists (
    select 1 from public.fulfillment_application_status_history
    where application_id = rpc_application_id and to_status = 'draft'
  ) then
    raise exception 'server application RPC did not create status history';
  end if;
  if not exists (
    select 1 from public.audit_events
    where entity_id = rpc_application_id::text and action = 'fulfillment_application.created'
  ) then
    raise exception 'server application RPC did not create audit history';
  end if;
end;
$$;

insert into public.platform_role_assignments (user_id, role, granted_by, reason)
values (
  '33333333-3333-4333-8333-333333333333',
  'application_reviewer',
  '33333333-3333-4333-8333-333333333333',
  'Disposable RLS test reviewer'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);

do $$
begin
  if (select count(*) from public.fulfillment_applications) <> 3 then
    raise exception 'reviewer cannot see all applications';
  end if;
  if not exists (select 1 from storage.objects where id = 'ea111111-1111-4111-8111-111111111111') then
    raise exception 'reviewer cannot see application evidence';
  end if;
end;
$$;

update public.fulfillment_applications
set status = 'submitted', submitted_at = now()
where id = 'a1111111-1111-4111-8111-111111111111';

update public.application_service_areas
set approved = true,
    approved_at = now(),
    approved_by = auth.uid()
where id = 'aa111111-1111-4111-8111-111111111111';

rollback;
