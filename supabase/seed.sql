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
) values (
  '00000000-0000-0000-0000-000000000000',
  'e2e00000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'e2e@dnd-tracker.test',
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
);

insert into auth.identities (
  id,
  user_id,
  provider_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) values (
  gen_random_uuid(),
  'e2e00000-0000-4000-8000-000000000001',
  'e2e00000-0000-4000-8000-000000000001',
  '{"sub": "e2e00000-0000-4000-8000-000000000001", "email": "e2e@dnd-tracker.test", "email_verified": true}',
  'email',
  now(),
  now(),
  now()
);

insert into public.profiles (
  id,
  email,
  username,
  name,
  avatar,
  marketing,
  "completedTour",
  "subscriptionType"
) values (
  'e2e00000-0000-4000-8000-000000000001',
  'e2e@dnd-tracker.test',
  'e2e-tester',
  'E2E Tester',
  'data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%201%201%22%2F%3E',
  false,
  true,
  'pro'
);
