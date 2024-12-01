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

# SQL to create the frequencia table
create_table_sql = """
create table if not exists public.frequencia (
    id bigint primary key generated always as identity,
    aluno_id bigint references public.alunos(id),
    data date not null,
    presente boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.frequencia enable row level security;

-- Allow read access to all authenticated users
create policy "Enable read access for all users" on public.frequencia
    for select using (true);

-- Allow insert/update/delete for authenticated users
create policy "Enable insert for authenticated users" on public.frequencia
    for insert with check (true);

create policy "Enable update for authenticated users" on public.frequencia
    for update using (true);

create policy "Enable delete for authenticated users" on public.frequencia
    for delete using (true);
"""

try:
    # Execute the SQL
    result = supabase.table('frequencia').select("*").limit(1).execute()
    print("Table already exists!")
except Exception as e:
    if "relation" in str(e) and "does not exist" in str(e):
        try:
            result = supabase.rpc('exec_sql', {'query': create_table_sql}).execute()
            print("Table created successfully!")
        except Exception as create_error:
            print(f"Error creating table: {str(create_error)}")
    else:
        print(f"Unexpected error: {str(e)}")
