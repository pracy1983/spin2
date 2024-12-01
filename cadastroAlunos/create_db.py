import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_database():
    # Conecta ao banco postgres padrão
    conn = psycopg2.connect(
        host="localhost",
        database="postgres",
        user="postgres",
        password="postgres"  # Use a senha que você definiu na instalação
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()
    
    # Cria o banco de dados auth_db se não existir
    cur.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'auth_db'")
    exists = cur.fetchone()
    if not exists:
        cur.execute('CREATE DATABASE auth_db')
        print("Banco de dados auth_db criado com sucesso!")
    else:
        print("Banco de dados auth_db já existe!")
    
    cur.close()
    conn.close()

if __name__ == '__main__':
    create_database()
