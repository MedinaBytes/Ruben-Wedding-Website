-- ==============================================================================
-- RUBEN & ANDREA WEDDING WEBSITE - COMPLETE SUPABASE DATABASE SCHEMA
-- Run this in your Supabase Project -> SQL Editor to initialize all tables.
-- ==============================================================================

-- 1. Enable pgcrypto for UUID generation
create extension if not exists pgcrypto;

-- 2. Create Invitations Table
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  token text,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  display_name text not null check (char_length(display_name) between 1 and 160),
  greeting_override text,
  language text check (language is null or language in ('en', 'es', 'de', 'hu')),
  group_name text,
  max_guests integer not null default 1 check (max_guests between 1 and 20),
  plus_one_allowed boolean not null default false,
  personal_message text,
  status text not null default 'active' check (status in ('active', 'draft', 'revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not plus_one_allowed or max_guests > 1)
);

-- 3. Create RSVPs Table
create table if not exists public.rsvps (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null unique references public.invitations(id) on delete cascade,
  attendance_status text not null check (attendance_status in ('yes', 'no')),
  attendee_count integer not null check (attendee_count >= 0),
  guest_names text[] not null default '{}',
  dietary_requirements text,
  notes text,
  language text check (language is null or language in ('en', 'es', 'de', 'hu')),
  submitted_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (attendance_status = 'no' and attendee_count = 0)
    or (attendance_status = 'yes' and attendee_count >= 1)
  )
);

-- 4. Create Song Requests Table
create table if not exists public.song_requests (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  slot smallint not null check (slot between 1 and 3),
  song_title text not null check (char_length(song_title) between 1 and 200),
  artist text check (artist is null or char_length(artist) <= 160),
  spotify_url text,
  selected_for_playlist boolean not null default false,
  submitted_at timestamptz not null default now(),
  unique (invitation_id, slot)
);

-- 5. Create Invitation Events Table
create table if not exists public.invitation_events (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  session_id uuid,
  event_type text not null check (
    event_type in (
      'INVITE_OPENED',
      'RSVP_STARTED',
      'RSVP_CONFIRMED',
      'RSVP_DECLINED',
      'LANGUAGE_CHANGED',
      'SONG_REQUESTED',
      'MAP_OPENED',
      'PLAYLIST_OPENED'
    )
  ),
  locale text check (locale is null or locale in ('en', 'es', 'de', 'hu')),
  created_at timestamptz not null default now()
);

-- 6. Create Site Settings Table
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- 7. Create Invitation Rate Limits Table
create table if not exists public.invitation_rate_limits (
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  action text not null check (action in ('rsvp', 'songs', 'event')),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  primary key (invitation_id, action, window_started_at)
);

-- 8. Create Admin Audit Log Table
create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_email text,
  action text not null check (
    action in (
      'ADMIN_SIGNED_IN',
      'ADMIN_SIGNED_OUT',
      'INVITATION_CREATED',
      'INVITATION_UPDATED',
      'INVITATION_REVOKED',
      'INVITATIONS_EXPORTED',
      'WEDDING_DATA_DELETED'
    )
  ),
  resource_type text not null check (resource_type in ('admin_session', 'invitation', 'guest_export', 'wedding_data')),
  resource_id uuid,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

-- 9. Indexes for Performance
create index if not exists invitation_events_invitation_created_idx
  on public.invitation_events (invitation_id, created_at desc);

create index if not exists song_requests_submitted_idx
  on public.song_requests (submitted_at desc);

create index if not exists admin_audit_log_created_at_idx 
  on public.admin_audit_log (created_at desc);

create index if not exists admin_audit_log_resource_idx 
  on public.admin_audit_log (resource_type, resource_id, created_at desc);

-- 10. Enable Row Level Security (RLS)
alter table public.invitations enable row level security;
alter table public.rsvps enable row level security;
alter table public.song_requests enable row level security;
alter table public.invitation_events enable row level security;
alter table public.site_settings enable row level security;
alter table public.invitation_rate_limits enable row level security;
alter table public.admin_audit_log enable row level security;

-- 11. Secure Permissions (Server-only / Service Role)
revoke all on public.invitations from anon, authenticated;
revoke all on public.rsvps from anon, authenticated;
revoke all on public.song_requests from anon, authenticated;
revoke all on public.invitation_events from anon, authenticated;
revoke all on public.site_settings from anon, authenticated;
revoke all on public.invitation_rate_limits from anon, authenticated;
revoke all on public.admin_audit_log from anon, authenticated;

-- 12. Helper Functions
create or replace function public.consume_invitation_rate_limit(
  p_invitation_id uuid,
  p_action text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_window_started_at timestamptz;
  v_request_count integer;
begin
  if p_limit < 1 or p_window_seconds < 1 then
    return false;
  end if;

  v_window_started_at := pg_catalog.to_timestamp(
    pg_catalog.floor(
      pg_catalog.extract(epoch from pg_catalog.clock_timestamp()) / p_window_seconds
    ) * p_window_seconds
  );

  insert into public.invitation_rate_limits (
    invitation_id,
    action,
    window_started_at,
    request_count
  )
  values (p_invitation_id, p_action, v_window_started_at, 1)
  on conflict (invitation_id, action, window_started_at)
  do update set request_count = public.invitation_rate_limits.request_count + 1
  returning request_count into v_request_count;

  return v_request_count <= p_limit;
end;
$$;

revoke all on function public.consume_invitation_rate_limit(uuid, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_invitation_rate_limit(uuid, text, integer, integer) to service_role;

create or replace function public.delete_wedding_data()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.admin_audit_log;
  delete from public.site_settings;
  delete from public.invitation_rate_limits;
  delete from public.invitation_events;
  delete from public.song_requests;
  delete from public.rsvps;
  delete from public.invitations;
end;
$$;

revoke all on function public.delete_wedding_data() from public, anon, authenticated;
grant execute on function public.delete_wedding_data() to service_role;
