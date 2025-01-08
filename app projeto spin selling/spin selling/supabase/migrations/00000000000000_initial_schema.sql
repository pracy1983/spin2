-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create profiles table
create table if not exists public.profiles (
    id uuid primary key references auth.users on delete cascade,
    email text unique,
    role text default 'user',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Create policies
create policy "Profiles are viewable by users who created them."
    on profiles for select
    using ( auth.uid() = id );

create policy "Users can insert their own profile."
    on profiles for insert
    with check ( auth.uid() = id );

create policy "Users can update own profile."
    on profiles for update
    using ( auth.uid() = id );

-- Create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, email)
    values (new.id, new.email);
    return new;
end;
$$ language plpgsql security definer;

-- Trigger for new signups
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();
