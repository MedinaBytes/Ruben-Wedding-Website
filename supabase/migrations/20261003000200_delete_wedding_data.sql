create or replace function public.delete_wedding_data()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
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