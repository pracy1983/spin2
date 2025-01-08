-- Drop existing objects
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Drop policies
drop policy if exists "Profiles are viewable by users who created them." on profiles;
drop policy if exists "Users can insert their own profile." on profiles;
drop policy if exists "Users can update own profile." on profiles;

-- Clean up data
delete from auth.users where email = 'paularacy@gmail.com';
delete from public.profiles where email = 'paularacy@gmail.com';

-- Drop tables
drop table if exists public.profiles cascade;
