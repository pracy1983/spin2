-- Drop existing trigger and function
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Create new function with better error handling
create or replace function public.handle_new_user()
returns trigger as $$
begin
    -- Verifica se já existe um perfil para este usuário
    if not exists (select 1 from public.profiles where id = new.id) then
        -- Insere apenas se não existir
        insert into public.profiles (id, email, role)
        values (
            new.id,
            new.email,
            coalesce(
                (new.raw_user_meta_data->>'role')::text,
                'user'
            )
        );
    end if;
    return new;
end;
$$ language plpgsql security definer;

-- Create new trigger
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- Update policies
drop policy if exists "Profiles are viewable by users who created them." on profiles;
drop policy if exists "Users can insert their own profile." on profiles;
drop policy if exists "Users can update own profile." on profiles;

create policy "Admins can manage all profiles"
    on profiles for all
    using ( auth.jwt() ->> 'role' = 'admin' )
    with check ( auth.jwt() ->> 'role' = 'admin' );

create policy "Users can view their own profile"
    on profiles for select
    using ( auth.uid() = id );

create policy "Users can update their own profile"
    on profiles for update
    using ( auth.uid() = id );
