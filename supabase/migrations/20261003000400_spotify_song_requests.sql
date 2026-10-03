alter table public.song_requests
  add column spotify_track_id text,
  add column album_artwork_url text,
  add column spotify_reservation_id uuid,
  add column playlist_status text not null default 'legacy'
    check (playlist_status in ('legacy', 'pending', 'added', 'already_in_playlist')),
  add constraint song_requests_spotify_reservation_check
    check ((playlist_status = 'pending' and spotify_reservation_id is not null)
      or (playlist_status <> 'pending' and spotify_reservation_id is null)),
  add constraint song_requests_spotify_track_id_check
    check (spotify_track_id is null or spotify_track_id ~ '^[A-Za-z0-9]{22}$');

create unique index song_requests_invitation_spotify_track_idx
  on public.song_requests (invitation_id, spotify_track_id)
  where spotify_track_id is not null;

create table public.spotify_playlist_tracks (
  track_id text primary key check (track_id ~ '^[A-Za-z0-9]{22}$'),
  status text not null check (status in ('pending', 'added')),
  reservation_id uuid,
  updated_at timestamptz not null default now(),
  check ((status = 'pending' and reservation_id is not null) or (status = 'added' and reservation_id is null))
);

create table public.spotify_oauth_credentials (
  id smallint primary key check (id = 1),
  refresh_token text not null,
  updated_at timestamptz not null default now()
);

alter table public.spotify_playlist_tracks enable row level security;
alter table public.spotify_oauth_credentials enable row level security;
revoke all on public.spotify_playlist_tracks from anon, authenticated;
revoke all on public.spotify_oauth_credentials from anon, authenticated;

alter table public.invitation_rate_limits
  drop constraint invitation_rate_limits_action_check;
alter table public.invitation_rate_limits
  add constraint invitation_rate_limits_action_check
    check (action in ('rsvp', 'songs', 'spotify_search', 'event'));

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
    return pg_catalog.jsonb_build_object('trackId', v_track_id, 'status', v_status);
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
  delete from public.invitation_rate_limits;
  delete from public.invitation_events;
  delete from public.song_requests;
  delete from public.rsvps;
  delete from public.invitations;
end;
$$;

revoke all on function public.delete_wedding_data() from public, anon, authenticated;
grant execute on function public.delete_wedding_data() to service_role;