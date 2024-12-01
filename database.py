from supabase import create_client
import os
from dotenv import load_dotenv

load_dotenv()

def db_connection():
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_ANON_KEY")
    return create_client(supabase_url, supabase_key)

def init_db():
    supabase = db_connection()
    
    # Criar tabela de usuários se não existir
    try:
        supabase.table('users').select("*").limit(1).execute()
    except:
        # Se a tabela não existe, criar
        supabase.table('users').create({
            "id": "uuid",
            "email": "varchar",
            "password": "varchar",
            "role": "varchar",
            "created_at": "timestamptz"
        })
    
    # Criar tabela de códigos de convite se não existir
    try:
        supabase.table('invite_codes').select("*").limit(1).execute()
    except:
        supabase.table('invite_codes').create({
            "id": "uuid",
            "code": "varchar",
            "used": "boolean",
            "created_at": "timestamptz",
            "used_at": "timestamptz"
        })
    
    # Criar tabela de tokens de reset de senha se não existir
    try:
        supabase.table('password_reset_tokens').select("*").limit(1).execute()
    except:
        supabase.table('password_reset_tokens').create({
            "id": "uuid",
            "user_id": "uuid",
            "token": "varchar",
            "created_at": "timestamptz",
            "expires_at": "timestamptz",
            "used": "boolean"
        })

if __name__ == '__main__':
    init_db()
