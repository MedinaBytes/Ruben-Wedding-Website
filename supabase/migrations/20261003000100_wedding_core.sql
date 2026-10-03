create table public.invitations (
  id uuid primary key default gen_random_uuid(),
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

create table public.rsvps (
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

create table public.song_requests (
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

create table public.invitation_events (
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

create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.invitation_rate_limits (
  invitation_id uuid not null references public.invitations(id) on delete cascade,
  action text not null check (action in ('rsvp', 'songs', 'event')),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  primary key (invitation_id, action, window_started_at)
);

create index invitation_events_invitation_created_idx
  on public.invitation_events (invitation_id, created_at desc);

create index song_requests_submitted_idx
  on public.song_requests (submitted_at desc);

alter table public.invitations enable row level security;
alter table public.rsvps enable row level security;
alter table public.song_requests enable row level security;
alter table public.invitation_events enable row level security;
alter table public.site_settings enable row level security;
alter table public.invitation_rate_limits enable row level security;

revoke all on public.invitations from anon, authenticated;
revoke all on public.rsvps from anon, authenticated;
revoke all on public.song_requests from anon, authenticated;
revoke all on public.invitation_events from anon, authenticated;
revoke all on public.site_settings from anon, authenticated;
revoke all on public.invitation_rate_limits from anon, authenticated;

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