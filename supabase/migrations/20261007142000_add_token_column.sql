-- Add token column to invitations table for direct link resolution and admin display
alter table public.invitations
  add column if not exists token text;

create index if not exists invitations_token_idx
  on public.invitations (token);
