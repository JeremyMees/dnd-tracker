insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
select
  '00000000-0000-0000-0000-000000000000',
  id,
  'authenticated',
  'authenticated',
  email,
  extensions.crypt('e2e-password', extensions.gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
from (values
  ('e2e00000-0000-4000-8000-000000000001'::uuid, 'e2e@dnd-tracker.test'),
  ('e2e00000-0000-4000-8000-000000000002'::uuid, 'e2e-other@dnd-tracker.test')
) as seed_users (id, email);

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  gen_random_uuid(),
  id,
  id::text,
  jsonb_build_object('sub', id, 'email', email, 'email_verified', true),
  'email',
  now(),
  now(),
  now()
from auth.users
where email like '%@dnd-tracker.test';

insert into public.profiles (
  id,
  email,
  username,
  name,
  avatar,
  marketing,
  "completedTour",
  "subscriptionType"
)
select
  id,
  email,
  username,
  name,
  'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%201%201%22%2F%3E',
  false,
  true,
  'pro'
from (values
  ('e2e00000-0000-4000-8000-000000000001'::uuid, 'e2e@dnd-tracker.test', 'e2e-tester', 'E2E Tester'),
  ('e2e00000-0000-4000-8000-000000000002'::uuid, 'e2e-other@dnd-tracker.test', 'e2e-other', 'E2E Other')
) as seed_profiles (id, email, username, name);
