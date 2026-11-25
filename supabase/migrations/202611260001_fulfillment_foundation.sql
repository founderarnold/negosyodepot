-- NegosyoDepot Fulfillment by MSMEs: additive Supabase foundation.
-- New staging project only. Do not apply to FLAME PH or MarketplacePH.
-- No sample, production, or identity records are inserted by this migration.

create extension if not exists pgcrypto;

create type public.organization_member_role as enum ('owner', 'administrator', 'editor', 'viewer');
create type public.platform_role as enum ('application_reviewer', 'accreditation_reviewer', 'operations_admin', 'security_admin');
create type public.fulfillment_role as enum ('brand_owner', 'hub_operator', 'logistics_provider', 'b2b_provider');
create type public.fulfillment_application_status as enum (
  'draft',
  'submitted',
  'under_review',
  'more_information_required',
  'approved_for_pilot',
  'accredited',
  'suspended',
  'expired',
  'rejected',
  'archived'
);
create type public.sync_run_status as enum ('queued', 'running', 'succeeded', 'partial', 'failed', 'cancelled');
create type public.integration_event_status as enum ('pending', 'processing', 'succeeded', 'failed', 'dead_letter');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id) on delete restrict,
  legal_name text,
  display_name text not null check (char_length(display_name) between 2 and 160),
  organization_type text not null check (organization_type in ('business', 'brand', 'hub', 'logistics', 'supplier', 'professional_service', 'other')),
  registration_type text,
  registration_reference text,
  status text not null default 'active' check (status in ('active', 'suspended', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_memberships (
  organization_id uuid not null references public.organizations(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  role public.organization_member_role not null,
  status text not null default 'active' check (status in ('pending', 'active', 'revoked')),
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.platform_role_assignments (
  user_id uuid not null references auth.users(id) on delete restrict,
  role public.platform_role not null,
  status text not null default 'active' check (status in ('active', 'suspended', 'revoked')),
  granted_by uuid references auth.users(id) on delete restrict,
  reason text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, role)
);

-- FLAME PH identity is authoritative. NegosyoDepot links by the stable site-specific subject,
-- never by email alone. Destination users cannot edit these source-owned fields.
create table public.ecosystem_identity_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete restrict,
  issuer text not null default 'flameph' check (issuer = 'flameph'),
  subject text not null,
  verified_email text,
  display_name text,
  source_version text,
  linked_at timestamptz not null default now(),
  last_verified_at timestamptz not null default now(),
  unique (issuer, subject)
);

create table public.profile_sync_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  source_system text not null check (source_system in ('flameph', 'marketplaceph')),
  destination_system text not null default 'negosyodepot' check (destination_system = 'negosyodepot'),
  purpose text not null check (char_length(purpose) between 10 and 500),
  consent_version text not null,
  approved_fields text[] not null check (cardinality(approved_fields) > 0),
  field_visibility jsonb not null default '{}'::jsonb check (jsonb_typeof(field_visibility) = 'object'),
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (revoked_at is null or revoked_at >= granted_at)
);

create unique index profile_sync_consents_active_unique
  on public.profile_sync_consents (user_id, source_system, destination_system, purpose)
  where revoked_at is null;

create table public.profile_sync_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  consent_id uuid not null references public.profile_sync_consents(id) on delete restrict,
  source_system text not null,
  source_subject text not null,
  source_version text,
  destination_version text,
  correlation_id uuid not null default gen_random_uuid(),
  idempotency_key text not null,
  status public.sync_run_status not null default 'queued',
  approved_fields text[] not null,
  changed_fields text[] not null default '{}',
  safe_result jsonb not null default '{}'::jsonb check (jsonb_typeof(safe_result) = 'object'),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  next_retry_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create table public.field_sync_conflicts (
  id uuid primary key default gen_random_uuid(),
  sync_run_id uuid not null references public.profile_sync_runs(id) on delete restrict,
  field_name text not null,
  source_version text,
  destination_version text,
  resolution text check (resolution in ('use_source', 'keep_destination', 'manual_value', 'cancelled')),
  resolved_by uuid references auth.users(id) on delete restrict,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  unique (sync_run_id, field_name),
  check ((resolution is null and resolved_at is null) or (resolution is not null and resolved_at is not null))
);

create table public.fulfillment_applications (
  id uuid primary key default gen_random_uuid(),
  reference_number text not null unique default (
    'FBM-' || to_char(clock_timestamp(), 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
  ),
  created_by uuid not null references auth.users(id) on delete restrict,
  organization_id uuid references public.organizations(id) on delete restrict,
  role public.fulfillment_role not null,
  status public.fulfillment_application_status not null default 'draft',
  source_system text not null default 'negosyodepot' check (source_system in ('negosyodepot', 'flameph')),
  source_application_id text,
  source_version text,
  consent_id uuid references public.profile_sync_consents(id) on delete restrict,
  idempotency_key text not null,
  public_summary text,
  private_notes text,
  submitted_at timestamptz,
  decided_at timestamptz,
  expires_at timestamptz,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (created_by, idempotency_key),
  check ((status = 'draft' and submitted_at is null) or status <> 'draft'),
  check (source_application_id is not null or source_system = 'negosyodepot')
);

create table public.fulfillment_application_status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.fulfillment_applications(id) on delete restrict,
  from_status public.fulfillment_application_status,
  to_status public.fulfillment_application_status not null,
  reason_code text,
  reason_note text,
  actor_user_id uuid references auth.users(id) on delete restrict,
  correlation_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table public.application_service_areas (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.fulfillment_applications(id) on delete restrict,
  coverage_level text not null check (coverage_level in ('city_municipality', 'province', 'region', 'multiple_regions', 'national', 'lane')),
  psgc_code text,
  area_name text not null,
  origin_psgc_code text,
  origin_name text,
  destination_psgc_code text,
  destination_name text,
  source_name text not null,
  source_version text not null,
  requested boolean not null default true,
  approved boolean not null default false,
  approved_by uuid references auth.users(id) on delete restrict,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  check (approved = false or approved_at is not null),
  check (coverage_level <> 'lane' or (origin_name is not null and destination_name is not null))
);

create table public.brand_capabilities (
  application_id uuid primary key references public.fulfillment_applications(id) on delete restrict,
  product_categories text[] not null default '{}',
  sku_count_band text,
  monthly_order_volume_band text,
  current_service_areas text[] not null default '{}',
  target_service_areas text[] not null default '{}',
  handling_constraints text,
  replenishment_needs text,
  wholesale_preferences text,
  required_services text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table public.hub_facilities (
  application_id uuid primary key references public.fulfillment_applications(id) on delete restrict,
  facility_control text not null check (facility_control in ('owned', 'leased', 'authorized_use', 'other')),
  public_location text not null,
  private_location text,
  operating_hours jsonb not null default '{}'::jsonb check (jsonb_typeof(operating_hours) = 'object'),
  capacity_bands jsonb not null default '{}'::jsonb check (jsonb_typeof(capacity_bands) = 'object'),
  storage_types text[] not null default '{}',
  equipment text[] not null default '{}',
  staffing_summary text,
  capabilities text[] not null default '{}',
  inventory_controls text,
  security_safety_practices text,
  exclusions text,
  service_commitments text,
  current_availability text not null default 'not_confirmed' check (current_availability in ('not_confirmed', 'available', 'limited', 'unavailable')),
  updated_at timestamptz not null default now()
);

create table public.logistics_capabilities (
  application_id uuid primary key references public.fulfillment_applications(id) on delete restrict,
  organization_type text not null,
  service_modes text[] not null,
  vehicle_vessel_classes text[] not null default '{}',
  parcel_load_constraints text,
  temperature_control boolean not null default false,
  operating_schedule jsonb not null default '{}'::jsonb check (jsonb_typeof(operating_schedule) = 'object'),
  lead_time_bands text,
  proof_of_delivery text,
  tracking_capability text,
  insurance_permits text,
  prohibited_goods text,
  rate_disclosure text not null default 'quote_based' check (rate_disclosure in ('quote_based', 'structured_reviewed')),
  escalation_contact text,
  updated_at timestamptz not null default now()
);

create table public.provider_capabilities (
  application_id uuid primary key references public.fulfillment_applications(id) on delete restrict,
  capability_types text[] not null,
  industries_served text[] not null default '{}',
  engagement_types text[] not null default '{}',
  moq_capacity_bands text,
  lead_time_bands text,
  certifications_summary text,
  credentials_review_status text not null default 'not_reviewed'
    check (credentials_review_status in ('not_reviewed', 'under_review', 'verified', 'rejected', 'expired')),
  updated_at timestamptz not null default now()
);

-- Metadata only. Object bytes live in the private fulfillment-evidence bucket.
create table public.application_evidence (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.fulfillment_applications(id) on delete restrict,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  object_path text not null unique,
  evidence_type text not null,
  original_filename text not null,
  content_type text not null,
  byte_size bigint not null check (byte_size > 0 and byte_size <= 10485760),
  sha256 text,
  review_status text not null default 'pending' check (review_status in ('pending', 'accepted', 'rejected', 'expired')),
  retention_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete restrict,
  actor_type text not null check (actor_type in ('member', 'reviewer', 'administrator', 'system', 'integration')),
  action text not null,
  entity_type text not null,
  entity_id text,
  correlation_id uuid not null,
  source_system text not null,
  consent_version text,
  changed_fields text[] not null default '{}',
  safe_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(safe_metadata) = 'object'),
  created_at timestamptz not null default now()
);

create table public.integration_outbox (
  id uuid primary key default gen_random_uuid(),
  destination_system text not null,
  event_type text not null,
  aggregate_type text not null,
  aggregate_id text not null,
  aggregate_version bigint not null check (aggregate_version > 0),
  idempotency_key text not null unique,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  status public.integration_event_status not null default 'pending',
  attempt_count integer not null default 0 check (attempt_count >= 0),
  next_attempt_at timestamptz not null default now(),
  last_error_code text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create table public.integration_inbox (
  id uuid primary key default gen_random_uuid(),
  source_system text not null,
  source_event_id text not null,
  event_type text not null,
  aggregate_type text not null,
  aggregate_id text not null,
  aggregate_version bigint not null check (aggregate_version > 0),
  payload_sha256 text not null,
  status public.integration_event_status not null default 'pending',
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  last_error_code text,
  unique (source_system, source_event_id)
);

create index organizations_created_by_idx on public.organizations(created_by);
create index organization_memberships_user_idx on public.organization_memberships(user_id, status);
create index profile_sync_runs_user_idx on public.profile_sync_runs(user_id, created_at desc);
create unique index fulfillment_applications_source_unique
  on public.fulfillment_applications(source_system, source_application_id)
  where source_application_id is not null;
create index fulfillment_applications_owner_idx on public.fulfillment_applications(created_by, status, updated_at desc);
create index fulfillment_applications_org_idx on public.fulfillment_applications(organization_id, status);
create index fulfillment_application_history_idx on public.fulfillment_application_status_history(application_id, created_at);
create index application_service_areas_idx on public.application_service_areas(application_id, coverage_level);
create index application_evidence_idx on public.application_evidence(application_id, created_at);
create index audit_events_entity_idx on public.audit_events(entity_type, entity_id, created_at desc);
create index integration_outbox_work_idx on public.integration_outbox(status, next_attempt_at);
create index integration_inbox_work_idx on public.integration_inbox(status, received_at);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_set_updated_at before update on public.organizations
  for each row execute function public.set_updated_at();
create trigger organization_memberships_set_updated_at before update on public.organization_memberships
  for each row execute function public.set_updated_at();
create trigger platform_role_assignments_set_updated_at before update on public.platform_role_assignments
  for each row execute function public.set_updated_at();
create trigger fulfillment_applications_set_updated_at before update on public.fulfillment_applications
  for each row execute function public.set_updated_at();
create trigger application_evidence_set_updated_at before update on public.application_evidence
  for each row execute function public.set_updated_at();

create or replace function public.guard_organization_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.id <> old.id or new.created_by <> old.created_by then
    raise exception 'protected_organization_fields';
  end if;
  return new;
end;
$$;

create trigger organizations_guard_update before update on public.organizations
  for each row execute function public.guard_organization_update();

create or replace function public.guard_sync_consent_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.id <> old.id
     or new.user_id <> old.user_id
     or new.source_system <> old.source_system
     or new.destination_system <> old.destination_system
     or new.purpose <> old.purpose
     or new.consent_version <> old.consent_version
     or new.approved_fields <> old.approved_fields
     or new.field_visibility <> old.field_visibility
     or new.granted_at <> old.granted_at
     or new.created_at <> old.created_at
     or (old.revoked_at is not null and new.revoked_at is distinct from old.revoked_at)
  then
    raise exception 'consent_is_append_only';
  end if;
  return new;
end;
$$;

create trigger profile_sync_consents_guard_update before update on public.profile_sync_consents
  for each row execute function public.guard_sync_consent_update();

create or replace function public.has_platform_role(allowed public.platform_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.platform_role_assignments r
    where r.user_id = auth.uid() and r.status = 'active' and r.role = any(allowed)
  );
$$;

create or replace function public.is_organization_member(target_organization uuid, allowed public.organization_member_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_memberships m
    where m.organization_id = target_organization
      and m.user_id = auth.uid()
      and m.status = 'active'
      and m.role = any(allowed)
  );
$$;

create or replace function public.can_access_fulfillment_application(target_application uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.fulfillment_applications a
    where a.id = target_application
      and (
        a.created_by = auth.uid()
        or (a.organization_id is not null and public.is_organization_member(a.organization_id, array['owner','administrator','editor','viewer']::public.organization_member_role[]))
        or public.has_platform_role(array['application_reviewer','accreditation_reviewer','operations_admin','security_admin']::public.platform_role[])
      )
  );
$$;

create or replace function public.can_edit_fulfillment_application(target_application uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.fulfillment_applications a
    where a.id = target_application
      and (
        ((a.created_by = auth.uid()
          or (a.organization_id is not null and public.is_organization_member(a.organization_id, array['owner','administrator','editor']::public.organization_member_role[])))
          and a.status in ('draft', 'more_information_required'))
        or public.has_platform_role(array['application_reviewer','accreditation_reviewer','operations_admin']::public.platform_role[])
      )
  );
$$;

create or replace function public.fulfillment_application_has_role(target_application uuid, expected public.fulfillment_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.fulfillment_applications a
    where a.id = target_application and a.role = expected
  );
$$;

create or replace function public.guard_member_application_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and not public.has_platform_role(array['application_reviewer','accreditation_reviewer','operations_admin']::public.platform_role[])
  then
    if old.status not in ('draft', 'more_information_required') then
      raise exception 'application_not_editable';
    end if;
    if new.created_by <> old.created_by
       or new.organization_id is distinct from old.organization_id
       or new.role <> old.role
       or new.status <> old.status
       or new.reference_number <> old.reference_number
       or new.source_system <> old.source_system
       or new.source_application_id is distinct from old.source_application_id
       or new.decided_at is distinct from old.decided_at
       or new.expires_at is distinct from old.expires_at
       or new.archived_at is distinct from old.archived_at
    then
      raise exception 'protected_application_fields';
    end if;
  end if;
  return new;
end;
$$;

create trigger fulfillment_applications_guard_member_update
  before update on public.fulfillment_applications
  for each row execute function public.guard_member_application_update();

create or replace function public.guard_service_area_review_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and not public.has_platform_role(array['application_reviewer','accreditation_reviewer','operations_admin']::public.platform_role[])
     and (new.approved <> old.approved or new.approved_by is distinct from old.approved_by or new.approved_at is distinct from old.approved_at)
  then
    raise exception 'review_fields_are_protected';
  end if;
  return new;
end;
$$;

create trigger application_service_areas_guard_review before update on public.application_service_areas
  for each row execute function public.guard_service_area_review_fields();

create or replace function public.guard_provider_review_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null
     and not public.has_platform_role(array['application_reviewer','accreditation_reviewer','operations_admin']::public.platform_role[])
     and new.credentials_review_status <> old.credentials_review_status
  then
    raise exception 'review_fields_are_protected';
  end if;
  return new;
end;
$$;

create trigger provider_capabilities_guard_review before update on public.provider_capabilities
  for each row execute function public.guard_provider_review_fields();

create or replace function public.storage_application_id(object_name text)
returns uuid
language plpgsql
immutable
set search_path = public, storage
as $$
declare
  parts text[];
begin
  parts := storage.foldername(object_name);
  if cardinality(parts) < 2 then return null; end if;
  return parts[2]::uuid;
exception when others then
  return null;
end;
$$;

create or replace function public.create_fulfillment_application(
  actor_user_id uuid,
  application_role public.fulfillment_role,
  request_idempotency_key text,
  request_correlation_id uuid,
  target_organization_id uuid default null
)
returns public.fulfillment_applications
language plpgsql
security definer
set search_path = public
as $$
declare
  result public.fulfillment_applications;
  inserted boolean := false;
begin
  if actor_user_id is null or request_idempotency_key is null or char_length(request_idempotency_key) < 16 then
    raise exception 'invalid_application_request';
  end if;

  if target_organization_id is not null and not exists (
    select 1 from public.organizations o
    where o.id = target_organization_id
      and (
        o.created_by = actor_user_id
        or exists (
          select 1 from public.organization_memberships m
          where m.organization_id = o.id
            and m.user_id = actor_user_id
            and m.status = 'active'
            and m.role in ('owner', 'administrator', 'editor')
        )
      )
  ) then
    raise exception 'organization_access_denied';
  end if;

  insert into public.fulfillment_applications
    (created_by, organization_id, role, idempotency_key)
  values
    (actor_user_id, target_organization_id, application_role, request_idempotency_key)
  on conflict (created_by, idempotency_key) do nothing
  returning * into result;

  if result.id is not null then
    inserted := true;
  else
    select * into result
    from public.fulfillment_applications
    where created_by = actor_user_id and idempotency_key = request_idempotency_key;
  end if;

  if inserted then
    insert into public.fulfillment_application_status_history
      (application_id, from_status, to_status, actor_user_id, correlation_id)
    values
      (result.id, null, 'draft', actor_user_id, request_correlation_id);

    insert into public.audit_events
      (actor_user_id, actor_type, action, entity_type, entity_id, correlation_id, source_system, changed_fields)
    values
      (actor_user_id, 'member', 'fulfillment_application.created', 'fulfillment_application', result.id::text, request_correlation_id, 'negosyodepot', array['role','status']);
  end if;

  return result;
end;
$$;

alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.platform_role_assignments enable row level security;
alter table public.ecosystem_identity_links enable row level security;
alter table public.profile_sync_consents enable row level security;
alter table public.profile_sync_runs enable row level security;
alter table public.field_sync_conflicts enable row level security;
alter table public.fulfillment_applications enable row level security;
alter table public.fulfillment_application_status_history enable row level security;
alter table public.application_service_areas enable row level security;
alter table public.brand_capabilities enable row level security;
alter table public.hub_facilities enable row level security;
alter table public.logistics_capabilities enable row level security;
alter table public.provider_capabilities enable row level security;
alter table public.application_evidence enable row level security;
alter table public.audit_events enable row level security;
alter table public.integration_outbox enable row level security;
alter table public.integration_inbox enable row level security;

create policy organizations_select on public.organizations for select to authenticated
  using (created_by = auth.uid() or public.is_organization_member(id, array['owner','administrator','editor','viewer']::public.organization_member_role[]) or public.has_platform_role(array['application_reviewer','accreditation_reviewer','operations_admin','security_admin']::public.platform_role[]));
create policy organizations_insert on public.organizations for insert to authenticated
  with check (created_by = auth.uid());
create policy organizations_update on public.organizations for update to authenticated
  using (created_by = auth.uid() or public.is_organization_member(id, array['owner','administrator']::public.organization_member_role[]) or public.has_platform_role(array['operations_admin']::public.platform_role[]))
  with check (created_by = auth.uid() or public.is_organization_member(id, array['owner','administrator']::public.organization_member_role[]) or public.has_platform_role(array['operations_admin']::public.platform_role[]));

create policy organization_memberships_select on public.organization_memberships for select to authenticated
  using (user_id = auth.uid() or public.is_organization_member(organization_id, array['owner','administrator']::public.organization_member_role[]) or public.has_platform_role(array['operations_admin','security_admin']::public.platform_role[]));

create policy platform_roles_self_select on public.platform_role_assignments for select to authenticated
  using (user_id = auth.uid() or public.has_platform_role(array['security_admin']::public.platform_role[]));

create policy ecosystem_identity_self_select on public.ecosystem_identity_links for select to authenticated
  using (user_id = auth.uid() or public.has_platform_role(array['security_admin']::public.platform_role[]));

create policy sync_consents_self_select on public.profile_sync_consents for select to authenticated using (user_id = auth.uid());
create policy sync_consents_self_insert on public.profile_sync_consents for insert to authenticated with check (user_id = auth.uid());
create policy sync_consents_self_update on public.profile_sync_consents for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy sync_runs_self_select on public.profile_sync_runs for select to authenticated using (user_id = auth.uid() or public.has_platform_role(array['security_admin']::public.platform_role[]));
create policy sync_conflicts_self_select on public.field_sync_conflicts for select to authenticated
  using (exists (select 1 from public.profile_sync_runs r where r.id = sync_run_id and r.user_id = auth.uid()) or public.has_platform_role(array['security_admin']::public.platform_role[]));

create policy applications_select on public.fulfillment_applications for select to authenticated
  using (public.can_access_fulfillment_application(id));
create policy applications_insert on public.fulfillment_applications for insert to authenticated
  with check (
    created_by = auth.uid()
    and status = 'draft'
    and (
      organization_id is null
      or exists (select 1 from public.organizations o where o.id = organization_id and o.created_by = auth.uid())
      or public.is_organization_member(organization_id, array['owner','administrator','editor']::public.organization_member_role[])
    )
  );
create policy applications_update on public.fulfillment_applications for update to authenticated
  using (public.can_edit_fulfillment_application(id)) with check (public.can_access_fulfillment_application(id));

create policy application_history_select on public.fulfillment_application_status_history for select to authenticated
  using (public.can_access_fulfillment_application(application_id));

create policy service_areas_select on public.application_service_areas for select to authenticated using (public.can_access_fulfillment_application(application_id));
create policy service_areas_insert on public.application_service_areas for insert to authenticated with check (public.can_edit_fulfillment_application(application_id) and approved = false);
create policy service_areas_update on public.application_service_areas for update to authenticated using (public.can_edit_fulfillment_application(application_id)) with check (public.can_edit_fulfillment_application(application_id));

create policy brand_capabilities_select on public.brand_capabilities for select to authenticated using (public.can_access_fulfillment_application(application_id));
create policy brand_capabilities_insert on public.brand_capabilities for insert to authenticated with check (public.can_edit_fulfillment_application(application_id) and public.fulfillment_application_has_role(application_id, 'brand_owner'));
create policy brand_capabilities_update on public.brand_capabilities for update to authenticated using (public.can_edit_fulfillment_application(application_id) and public.fulfillment_application_has_role(application_id, 'brand_owner')) with check (public.can_edit_fulfillment_application(application_id) and public.fulfillment_application_has_role(application_id, 'brand_owner'));
create policy hub_facilities_select on public.hub_facilities for select to authenticated using (public.can_access_fulfillment_application(application_id));
create policy hub_facilities_insert on public.hub_facilities for insert to authenticated with check (public.can_edit_fulfillment_application(application_id) and public.fulfillment_application_has_role(application_id, 'hub_operator'));
create policy hub_facilities_update on public.hub_facilities for update to authenticated using (public.can_edit_fulfillment_application(application_id) and public.fulfillment_application_has_role(application_id, 'hub_operator')) with check (public.can_edit_fulfillment_application(application_id) and public.fulfillment_application_has_role(application_id, 'hub_operator'));
create policy logistics_capabilities_select on public.logistics_capabilities for select to authenticated using (public.can_access_fulfillment_application(application_id));
create policy logistics_capabilities_insert on public.logistics_capabilities for insert to authenticated with check (public.can_edit_fulfillment_application(application_id) and public.fulfillment_application_has_role(application_id, 'logistics_provider'));
create policy logistics_capabilities_update on public.logistics_capabilities for update to authenticated using (public.can_edit_fulfillment_application(application_id) and public.fulfillment_application_has_role(application_id, 'logistics_provider')) with check (public.can_edit_fulfillment_application(application_id) and public.fulfillment_application_has_role(application_id, 'logistics_provider'));
create policy provider_capabilities_select on public.provider_capabilities for select to authenticated using (public.can_access_fulfillment_application(application_id));
create policy provider_capabilities_insert on public.provider_capabilities for insert to authenticated with check (public.can_edit_fulfillment_application(application_id) and public.fulfillment_application_has_role(application_id, 'b2b_provider'));
create policy provider_capabilities_update on public.provider_capabilities for update to authenticated using (public.can_edit_fulfillment_application(application_id) and public.fulfillment_application_has_role(application_id, 'b2b_provider')) with check (public.can_edit_fulfillment_application(application_id) and public.fulfillment_application_has_role(application_id, 'b2b_provider'));

create policy evidence_select on public.application_evidence for select to authenticated using (public.can_access_fulfillment_application(application_id));
create policy evidence_insert on public.application_evidence for insert to authenticated
  with check (uploaded_by = auth.uid() and public.can_edit_fulfillment_application(application_id));
create policy evidence_update_reviewers on public.application_evidence for update to authenticated
  using (public.has_platform_role(array['application_reviewer','accreditation_reviewer','operations_admin']::public.platform_role[]))
  with check (public.has_platform_role(array['application_reviewer','accreditation_reviewer','operations_admin']::public.platform_role[]));

create policy audit_events_actor_select on public.audit_events for select to authenticated
  using (actor_user_id = auth.uid() or public.has_platform_role(array['operations_admin','security_admin']::public.platform_role[]));

revoke all on public.organizations, public.organization_memberships, public.platform_role_assignments,
  public.ecosystem_identity_links, public.profile_sync_consents, public.profile_sync_runs,
  public.field_sync_conflicts, public.fulfillment_applications, public.fulfillment_application_status_history,
  public.application_service_areas, public.brand_capabilities, public.hub_facilities,
  public.logistics_capabilities, public.provider_capabilities, public.application_evidence,
  public.audit_events, public.integration_outbox, public.integration_inbox from anon;
grant select, insert, update on public.organizations to authenticated;
grant select on public.organization_memberships, public.platform_role_assignments, public.ecosystem_identity_links to authenticated;
grant select, insert, update on public.profile_sync_consents to authenticated;
grant select on public.profile_sync_runs, public.field_sync_conflicts to authenticated;
grant select, insert, update on public.fulfillment_applications to authenticated;
grant select on public.fulfillment_application_status_history to authenticated;
grant select, insert, update on public.application_service_areas to authenticated;
grant select, insert, update on public.brand_capabilities, public.hub_facilities, public.logistics_capabilities, public.provider_capabilities to authenticated;
grant select, insert, update on public.application_evidence to authenticated;
grant select on public.audit_events to authenticated;
revoke all on public.integration_outbox, public.integration_inbox from anon, authenticated;

revoke execute on function public.has_platform_role(public.platform_role[]) from public, anon;
revoke execute on function public.is_organization_member(uuid, public.organization_member_role[]) from public, anon;
revoke execute on function public.can_access_fulfillment_application(uuid) from public, anon;
revoke execute on function public.can_edit_fulfillment_application(uuid) from public, anon;
revoke execute on function public.fulfillment_application_has_role(uuid, public.fulfillment_role) from public, anon;
grant execute on function public.has_platform_role(public.platform_role[]) to authenticated;
grant execute on function public.is_organization_member(uuid, public.organization_member_role[]) to authenticated;
grant execute on function public.can_access_fulfillment_application(uuid) to authenticated;
grant execute on function public.can_edit_fulfillment_application(uuid) to authenticated;
grant execute on function public.fulfillment_application_has_role(uuid, public.fulfillment_role) to authenticated;
revoke execute on function public.create_fulfillment_application(uuid, public.fulfillment_role, text, uuid, uuid) from public, anon, authenticated;
grant execute on function public.create_fulfillment_application(uuid, public.fulfillment_role, text, uuid, uuid) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fulfillment-evidence',
  'fulfillment-evidence',
  false,
  10485760,
  array['application/pdf','image/jpeg','image/png','image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy fulfillment_evidence_select on storage.objects for select to authenticated
  using (bucket_id = 'fulfillment-evidence' and public.can_access_fulfillment_application(public.storage_application_id(name)));

create policy fulfillment_evidence_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'fulfillment-evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.can_edit_fulfillment_application(public.storage_application_id(name))
  );

create policy fulfillment_evidence_update on storage.objects for update to authenticated
  using (
    bucket_id = 'fulfillment-evidence'
    and owner_id = auth.uid()::text
    and public.can_edit_fulfillment_application(public.storage_application_id(name))
  )
  with check (
    bucket_id = 'fulfillment-evidence'
    and owner_id = auth.uid()::text
    and public.can_edit_fulfillment_application(public.storage_application_id(name))
  );

comment on table public.ecosystem_identity_links is 'Stable FLAME PH subject links. Source-owned identity fields are written only by trusted server code.';
comment on table public.profile_sync_runs is 'Privacy-safe sync audit: identifiers, versions, fields and outcomes; never raw sensitive field values.';
comment on table public.integration_outbox is 'Reliable server-only integration events. Browser roles have no access.';
comment on table public.integration_inbox is 'Idempotent server-only received events. Browser roles have no access.';
comment on table public.audit_events is 'Append-only audit metadata. No update or delete grants are issued.';
