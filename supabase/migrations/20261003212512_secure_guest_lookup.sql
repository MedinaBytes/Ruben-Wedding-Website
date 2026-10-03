alter table public.invitations
	add column if not exists email text,
	add column if not exists normalized_email text,
	add column if not exists phone text,
	add column if not exists normalized_phone text,
	add column if not exists whatsapp text,
	add column if not exists normalized_whatsapp text,
	add column if not exists normalized_name text,
	add column if not exists normalized_group_name text;

update public.invitations
set normalized_name = lower(regexp_replace(normalize(btrim(display_name), NFC), '\s+', ' ', 'g'));

update public.invitations
set normalized_group_name = lower(regexp_replace(normalize(btrim(group_name), NFC), '\s+', ' ', 'g'))
where group_name is not null;

update public.invitations
set normalized_email = lower(btrim(email))
where email is not null and normalized_email is null;

update public.invitations
set normalized_phone = '+' || regexp_replace(btrim(phone), '\D', '', 'g')
where phone ~ '^\s*\+' and normalized_phone is null;

update public.invitations
set normalized_whatsapp = '+' || regexp_replace(btrim(whatsapp), '\D', '', 'g')
where whatsapp ~ '^\s*\+' and normalized_whatsapp is null;

create index if not exists invitations_lookup_name_status_idx
	on public.invitations (normalized_name, status);

create index if not exists invitations_lookup_group_status_idx
	on public.invitations (normalized_group_name, status);

create index if not exists invitations_lookup_email_status_idx
	on public.invitations (normalized_email, status);

create index if not exists invitations_lookup_phone_status_idx
	on public.invitations (normalized_phone, status);

create index if not exists invitations_lookup_whatsapp_status_idx
	on public.invitations (normalized_whatsapp, status);

create table if not exists public.invitation_token_aliases (
	token_hash text primary key check (token_hash ~ '^[a-f0-9]{64}$'),
	invitation_id uuid not null references public.invitations(id) on delete cascade,
	created_at timestamptz not null default now()
);

create index if not exists invitation_token_aliases_invitation_idx
	on public.invitation_token_aliases (invitation_id);

create table if not exists public.guest_lookup_rate_limits (
	key_type text not null check (key_type in ('session', 'identifier')),
	key_hash text not null check (key_hash ~ '^[a-f0-9]{64}$'),
	window_started_at timestamptz not null,
	request_count integer not null check (request_count > 0),
	primary key (key_type, key_hash, window_started_at)
);

create index if not exists guest_lookup_rate_limits_window_idx
	on public.guest_lookup_rate_limits (window_started_at);

alter table public.invitation_token_aliases enable row level security;
alter table public.guest_lookup_rate_limits enable row level security;

revoke all on public.invitation_token_aliases from anon, authenticated;
revoke all on public.guest_lookup_rate_limits from anon, authenticated;
grant all on public.invitation_token_aliases to service_role;
grant all on public.guest_lookup_rate_limits to service_role;

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

do $$
begin
	if exists (
		select 1 from information_schema.columns
		where table_schema = 'public' and table_name = 'invitations' and column_name = 'token'
	) then
		execute 'update public.invitations set token = null where token is not null';
	end if;
end;
$$;

alter table public.invitations drop constraint if exists invitations_language_check;
alter table public.rsvps drop constraint if exists rsvps_language_check;
alter table public.invitation_events drop constraint if exists invitation_events_locale_check;

update public.invitations set language = 'de-AT' where language = 'de';
update public.rsvps set language = 'de-AT' where language = 'de';
update public.invitation_events set locale = 'de-AT' where locale = 'de';

alter table public.invitations
	add constraint invitations_language_check check (language is null or language in ('en', 'es', 'de-AT', 'hu'));
alter table public.rsvps
	add constraint rsvps_language_check check (language is null or language in ('en', 'es', 'de-AT', 'hu'));
alter table public.invitation_events
	add constraint invitation_events_locale_check check (locale is null or locale in ('en', 'es', 'de-AT', 'hu'));

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
