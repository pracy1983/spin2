-- Remove o trigger e a função que cria perfil automaticamente
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Atualiza as políticas para permitir que o admin gerencie todos os perfis
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
