-- ==============================================================================
-- RUBEN & ANDREA WEDDING WEBSITE - COMPLETE SUPABASE DATABASE SCHEMA
-- Run this in your Supabase Project -> SQL Editor to initialize all tables.
-- ==============================================================================

-- 1. Enable pgcrypto for UUID generation
create extension if not exists pgcrypto;

-- 2. Create Invitations Table
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  display_name text not null check (char_length(display_name) between 1 and 160),
  normalized_name text,
  normalized_group_name text,
  email text,
  normalized_email text,
  phone text,
  normalized_phone text,
  whatsapp text,
  normalized_whatsapp text,
  greeting_override text,
  language text check (language is null or language in ('en', 'es', 'de-AT', 'hu')),
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
  language text check (language is null or language in ('en', 'es', 'de-AT', 'hu')),
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
  spotify_track_id text check (spotify_track_id is null or spotify_track_id ~ '^[A-Za-z0-9]{22}$'),
  album_artwork_url text,
  spotify_reservation_id uuid,
  playlist_status text not null default 'legacy' check (playlist_status in ('legacy', 'pending', 'added', 'already_in_playlist')),
  selected_for_playlist boolean not null default false,
  submitted_at timestamptz not null default now(),
  unique (invitation_id, slot),
  check ((playlist_status = 'pending' and spotify_reservation_id is not null)
    or (playlist_status <> 'pending' and spotify_reservation_id is null))
);

create unique index if not exists song_requests_invitation_spotify_track_idx
  on public.song_requests (invitation_id, spotify_track_id)
  where spotify_track_id is not null;

create table if not exists public.spotify_playlist_tracks (
  track_id text primary key check (track_id ~ '^[A-Za-z0-9]{22}$'),
  status text not null check (status in ('pending', 'added')),
  reservation_id uuid,
  updated_at timestamptz not null default now(),
  check ((status = 'pending' and reservation_id is not null) or (status = 'added' and reservation_id is null))
);

create table if not exists public.spotify_oauth_credentials (
  id smallint primary key check (id = 1),
  refresh_token text not null,
  updated_at timestamptz not null default now()
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
  locale text check (locale is null or locale in ('en', 'es', 'de-AT', 'hu')),
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
  action text not null check (action in ('rsvp', 'songs', 'spotify_search', 'event')),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  primary key (invitation_id, action, window_started_at)
);

create table if not exists public.invitation_token_aliases (
  token_hash text primary key check (token_hash ~ '^[a-f0-9]{64}$'),
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.guest_lookup_rate_limits (
  key_type text not null check (key_type in ('session', 'identifier')),
  key_hash text not null check (key_hash ~ '^[a-f0-9]{64}$'),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  primary key (key_type, key_hash, window_started_at)
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
create index if not exists invitations_lookup_name_idx
  on public.invitations (normalized_name, status);

create index if not exists invitations_lookup_group_idx
  on public.invitations (normalized_group_name, status);

create index if not exists invitations_lookup_email_idx
  on public.invitations (normalized_email, status);

create index if not exists invitations_lookup_phone_idx
  on public.invitations (normalized_phone, normalized_whatsapp, status);

create index if not exists invitation_token_aliases_invitation_idx
  on public.invitation_token_aliases (invitation_id);

create index if not exists guest_lookup_rate_limits_window_idx
  on public.guest_lookup_rate_limits (window_started_at);

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
alter table public.spotify_playlist_tracks enable row level security;
alter table public.spotify_oauth_credentials enable row level security;
alter table public.invitation_events enable row level security;
alter table public.site_settings enable row level security;
alter table public.invitation_rate_limits enable row level security;
alter table public.invitation_token_aliases enable row level security;
alter table public.guest_lookup_rate_limits enable row level security;
alter table public.admin_audit_log enable row level security;

-- 11. Secure Permissions (Server-only / Service Role)
revoke all on public.invitations from anon, authenticated;
revoke all on public.rsvps from anon, authenticated;
revoke all on public.song_requests from anon, authenticated;
revoke all on public.spotify_playlist_tracks from anon, authenticated;
revoke all on public.spotify_oauth_credentials from anon, authenticated;
revoke all on public.invitation_events from anon, authenticated;
revoke all on public.site_settings from anon, authenticated;
revoke all on public.invitation_rate_limits from anon, authenticated;
revoke all on public.invitation_token_aliases from anon, authenticated;
revoke all on public.guest_lookup_rate_limits from anon, authenticated;
grant all on public.invitation_token_aliases to service_role;
grant all on public.guest_lookup_rate_limits to service_role;
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
      extract(epoch from pg_catalog.clock_timestamp()) / p_window_seconds
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

create or replace function public.consume_guest_lookup_rate_limit(
  p_key_type text,
  p_key_hash text,
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
  if coalesce(p_key_type not in ('session', 'identifier'), true)
    or coalesce(p_key_hash !~ '^[a-f0-9]{64}$', true)
    or p_limit is null or p_limit < 1
    or p_window_seconds is null or p_window_seconds < 1 then
    return false;
  end if;

  v_window_started_at := pg_catalog.to_timestamp(
    pg_catalog.floor(
      extract(epoch from pg_catalog.clock_timestamp()) / p_window_seconds
    ) * p_window_seconds
  );

  insert into public.guest_lookup_rate_limits (
    key_type,
    key_hash,
    window_started_at,
    request_count
  )
  values (p_key_type, p_key_hash, v_window_started_at, 1)
  on conflict (key_type, key_hash, window_started_at)
  do update set request_count = public.guest_lookup_rate_limits.request_count + 1
  returning request_count into v_request_count;

  delete from public.guest_lookup_rate_limits
  where window_started_at < pg_catalog.clock_timestamp() - interval '2 days';

  return v_request_count <= p_limit;
end;
$$;

revoke all on function public.consume_guest_lookup_rate_limit(text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_guest_lookup_rate_limit(text, text, integer, integer)
  to service_role;

create or replace function public.reserve_spotify_song_request(
  p_invitation_id uuid,
  p_track jsonb,
  p_existing_track_ids text[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_track_id text := p_track ->> 'id';
  v_title text := p_track ->> 'title';
  v_artist text := p_track ->> 'artist';
  v_artwork_url text := p_track ->> 'artworkUrl';
  v_existing_request public.song_requests%rowtype;
  v_playlist_track public.spotify_playlist_tracks%rowtype;
  v_slot smallint;
  v_count integer;
  v_reservation_id uuid;
  v_status text;
begin
  if v_track_id is null or v_track_id !~ '^[A-Za-z0-9]{22}$'
    or v_title is null or pg_catalog.char_length(v_title) not between 1 and 200
    or pg_catalog.char_length(coalesce(v_artist, '')) > 160
    or pg_catalog.char_length(coalesce(v_artwork_url, '')) > 2048 then
    raise exception 'invalid_spotify_track';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_invitation_id::text, 0));

  if not exists (
    select 1 from public.invitations
    where id = p_invitation_id and status = 'active'
  ) then
    raise exception 'invitation_not_active';
  end if;

  select * into v_existing_request
  from public.song_requests
  where invitation_id = p_invitation_id and spotify_track_id = v_track_id
  for update;

  if found then
    if v_existing_request.playlist_status = 'pending'
      and v_track_id = any(coalesce(p_existing_track_ids, array[]::text[])) then
      update public.song_requests
        set playlist_status = 'added', selected_for_playlist = true, spotify_reservation_id = null
        where id = v_existing_request.id;
      update public.spotify_playlist_tracks
        set status = 'added', reservation_id = null, updated_at = pg_catalog.now()
        where track_id = v_track_id;
      v_status := 'already_in_playlist';
    elsif v_existing_request.playlist_status = 'pending' then
      select * into v_playlist_track
      from public.spotify_playlist_tracks
      where track_id = v_track_id
      for update;

      if found and v_playlist_track.status = 'added' then
        update public.song_requests
          set playlist_status = 'added', selected_for_playlist = true, spotify_reservation_id = null
          where id = v_existing_request.id;
        v_status := 'already_in_playlist';
      elsif found and v_playlist_track.status = 'pending'
        and v_playlist_track.updated_at < pg_catalog.now() - interval '10 minutes' then
        v_reservation_id := pg_catalog.gen_random_uuid();
        update public.spotify_playlist_tracks
          set reservation_id = v_reservation_id, updated_at = pg_catalog.now()
          where track_id = v_track_id and status = 'pending';
        update public.song_requests
          set spotify_reservation_id = v_reservation_id
          where id = v_existing_request.id;
        v_status := 'reserved';
      else
        v_status := 'busy';
      end if;
    else
      v_status := 'already_submitted';
    end if;
    return pg_catalog.jsonb_build_object(
      'trackId', v_track_id,
      'status', v_status,
      'reservationId', case when v_status = 'reserved' then v_reservation_id else null end
    );
  end if;

  select pg_catalog.count(*) into v_count
  from public.song_requests
  where invitation_id = p_invitation_id;

  if v_count >= 3 then
    return pg_catalog.jsonb_build_object('trackId', v_track_id, 'status', 'maximum_reached');
  end if;

  select candidates.slot into v_slot
  from pg_catalog.generate_series(1, 3) as candidates(slot)
  where not exists (
    select 1 from public.song_requests
    where invitation_id = p_invitation_id and slot = candidates.slot
  )
  order by candidates.slot
  limit 1;

  if v_track_id = any(coalesce(p_existing_track_ids, array[]::text[])) then
    insert into public.spotify_playlist_tracks (track_id, status)
    values (v_track_id, 'added')
    on conflict (track_id) do update
      set status = 'added', reservation_id = null, updated_at = pg_catalog.now();
    v_status := 'already_in_playlist';
  else
    v_reservation_id := pg_catalog.gen_random_uuid();
    insert into public.spotify_playlist_tracks (track_id, status, reservation_id)
    values (v_track_id, 'pending', v_reservation_id)
    on conflict (track_id) do nothing;

    if not found then
      select * into v_playlist_track
      from public.spotify_playlist_tracks
      where track_id = v_track_id
      for update;

      if v_playlist_track.status = 'added' then
        v_status := 'already_in_playlist';
      elsif v_playlist_track.updated_at < pg_catalog.now() - interval '10 minutes' then
        v_reservation_id := pg_catalog.gen_random_uuid();
        update public.spotify_playlist_tracks
          set reservation_id = v_reservation_id, updated_at = pg_catalog.now()
          where track_id = v_track_id and status = 'pending';
        v_status := 'reserved';
      else
        v_status := 'busy';
      end if;
    else
      v_status := 'reserved';
    end if;
  end if;

  insert into public.song_requests (
    invitation_id, slot, song_title, artist, spotify_url, spotify_track_id,
    album_artwork_url, spotify_reservation_id, selected_for_playlist, playlist_status
  ) values (
    p_invitation_id, v_slot, v_title, nullif(v_artist, ''),
    'https://open.spotify.com/track/' || v_track_id,
    v_track_id, nullif(v_artwork_url, ''),
    case when v_status = 'reserved' then v_reservation_id else null end,
    v_status = 'already_in_playlist',
    case when v_status = 'reserved' then 'pending' else 'already_in_playlist' end
  );

  return pg_catalog.jsonb_build_object(
    'trackId', v_track_id,
    'status', v_status,
    'reservationId', case when v_status = 'reserved' then v_reservation_id else null end
  );
end;
$$;

create or replace function public.complete_spotify_song_request(
  p_invitation_id uuid,
  p_track_id text,
  p_reservation_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated integer;
begin
  update public.song_requests
    set playlist_status = 'added', selected_for_playlist = true, spotify_reservation_id = null
    where invitation_id = p_invitation_id and spotify_track_id = p_track_id
      and playlist_status = 'pending' and spotify_reservation_id = p_reservation_id;
  get diagnostics v_updated = row_count;

  update public.spotify_playlist_tracks
    set status = 'added', reservation_id = null, updated_at = pg_catalog.now()
    where track_id = p_track_id and reservation_id = p_reservation_id;

  return v_updated = 1;
end;
$$;

create or replace function public.release_spotify_song_request(
  p_invitation_id uuid,
  p_track_id text,
  p_reservation_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.song_requests
    where invitation_id = p_invitation_id and spotify_track_id = p_track_id
      and playlist_status = 'pending' and spotify_reservation_id = p_reservation_id;
  delete from public.spotify_playlist_tracks
    where track_id = p_track_id and status = 'pending'
      and reservation_id = p_reservation_id;
end;
$$;

revoke all on function public.reserve_spotify_song_request(uuid, jsonb, text[]) from public, anon, authenticated;
revoke all on function public.complete_spotify_song_request(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.release_spotify_song_request(uuid, text, uuid) from public, anon, authenticated;
grant execute on function public.reserve_spotify_song_request(uuid, jsonb, text[]) to service_role;
grant execute on function public.complete_spotify_song_request(uuid, text, uuid) to service_role;
grant execute on function public.release_spotify_song_request(uuid, text, uuid) to service_role;

create or replace function public.delete_wedding_data()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.admin_audit_log;
  delete from public.spotify_oauth_credentials;
  delete from public.spotify_playlist_tracks;
  delete from public.site_settings;
  delete from public.guest_lookup_rate_limits;
  delete from public.invitation_rate_limits;
  delete from public.invitation_events;
  delete from public.song_requests;
  delete from public.rsvps;
  delete from public.invitations;
end;
$$;

revoke all on function public.delete_wedding_data() from public, anon, authenticated;
grant execute on function public.delete_wedding_data() to service_role;
