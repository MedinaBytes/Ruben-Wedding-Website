-- Fix check constraints on invitations and rsvps:
-- 1. Allow plus_one_allowed = true regardless of max_guests (e.g. 1 primary guest + 1 companion).
-- 2. Allow 'de-AT' in language constraints.

alter table public.invitations
  drop constraint if exists invitations_check;

alter table public.invitations
  drop constraint if exists invitations_language_check;

alter table public.invitations
  add constraint invitations_language_check
  check (language is null or language in ('en', 'es', 'de', 'de-AT', 'hu'));

alter table public.rsvps
  drop constraint if exists rsvps_language_check;

alter table public.rsvps
  add constraint rsvps_language_check
  check (language is null or language in ('en', 'es', 'de', 'de-AT', 'hu'));
