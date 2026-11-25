-- Minimal local catalog used only to syntax-check the migration in plain PostgreSQL.
-- The real staging test must run against Supabase and its actual auth/storage schemas.

create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;

create schema auth;
create schema storage;

create table auth.users (
  id uuid primary key,
  email text
);

create or replace function auth.uid()
returns uuid
language sql
stable
as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
$$;

grant usage on schema auth to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;

create table storage.buckets (
  id text primary key,
  name text not null,
  public boolean not null default false,
  file_size_limit bigint,
  allowed_mime_types text[]
);

create table storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null references storage.buckets(id),
  name text not null,
  owner_id text
);

alter table storage.objects enable row level security;
grant select, insert, update, delete on storage.objects to anon, authenticated;
grant select on storage.buckets to anon, authenticated;

create or replace function storage.foldername(name text)
returns text[]
language sql
immutable
as $$
  select case
    when position('/' in name) = 0 then array[]::text[]
    else string_to_array(regexp_replace(name, '/[^/]+$', ''), '/')
  end;
$$;


grant usage on schema storage to anon, authenticated;
grant execute on function storage.foldername(text) to anon, authenticated;
