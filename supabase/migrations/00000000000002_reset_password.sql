-- Reset user password directly in the database
update auth.users
set encrypted_password = crypt('adm@123', gen_salt('bf'))
where email = 'paularacy@gmail.com';

-- Ensure user has correct role
update public.profiles
set role = 'admin'
where email = 'paularacy@gmail.com';
