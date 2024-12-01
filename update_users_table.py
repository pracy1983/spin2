from supabase import create_client
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_ANON_KEY')
)

# SQL para atualizar a tabela users
update_table_sql = """
-- Adicionar novas colunas à tabela users
alter table public.users 
    add column if not exists name text,
    add column if not exists phone text,
    add column if not exists role text default 'user';

-- Atualizar políticas RLS
alter table public.users enable row level security;

-- Permitir select para usuários autenticados
create policy if not exists "Allow select for authenticated users"
    on public.users
    for select
    to authenticated
    using (true);

-- Permitir update apenas no próprio registro (exceto para admin e owner)
create policy if not exists "Allow update own record"
    on public.users
    for update
    to authenticated
    using (auth.uid() = id or auth.jwt() ->> 'role' in ('adm', 'owner'));

-- Permitir insert apenas para admin e owner
create policy if not exists "Allow insert for admins"
    on public.users
    for insert
    to authenticated
    with check (auth.jwt() ->> 'role' in ('adm', 'owner'));

-- Permitir delete apenas para owner
create policy if not exists "Allow delete for owners"
    on public.users
    for delete
    to authenticated
    using (auth.jwt() ->> 'role' = 'owner');
"""

try:
    # Executar o SQL
    result = supabase.rpc('exec_sql', {'query': update_table_sql}).execute()
    print("Tabela users atualizada com sucesso!")
except Exception as e:
    print(f"Erro ao atualizar tabela: {str(e)}")
