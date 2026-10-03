create table public.admin_audit_log (
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

create index admin_audit_log_created_at_idx on public.admin_audit_log (created_at desc);
create index admin_audit_log_resource_idx on public.admin_audit_log (resource_type, resource_id, created_at desc);

alter table public.admin_audit_log enable row level security;
revoke all on public.admin_audit_log from anon, authenticated;
