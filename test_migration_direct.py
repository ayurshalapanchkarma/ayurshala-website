#!/usr/bin/env python3

import psycopg2
from psycopg2 import sql
import os
from pathlib import Path

# Supabase PostgreSQL connection details
# Format: postgresql://user:password@host:port/database
SUPABASE_URL = "postgresql://postgres.edwzyrdikttdxmphpvvp:[PASSWORD]@db.edwzyrdikttdxmphpvvp.supabase.co:5432/postgres"

# Get connection string from env or construct
def get_connection():
    """Connect to Supabase PostgreSQL"""
    try:
        # Try using Supabase connection string format
        conn = psycopg2.connect(
            host="db.edwzyrdikttdxmphpvvp.supabase.co",
            port=5432,
            database="postgres",
            user="postgres",
            password="Ayurshala@2025",  # This should be the actual password
            sslmode="require"
        )
        return conn
    except Exception as e:
        print(f"❌ Connection failed: {e}")
        return None

def read_migration():
    """Read and parse migration file"""
    migration_file = Path(__file__).parent / 'migrations' / 'inventory_core.sql'
    with open(migration_file, 'r') as f:
        content = f.read()
    
    # Split into statements
    statements = content.split(';')
    statements = [s.strip() for s in statements if s.strip() and not s.strip().startswith('--')]
    
    return statements

def test_migration():
    """Test each SQL statement"""
    print('🚀 Testing inventory_core.sql against Supabase PostgreSQL\n')
    
    conn = get_connection()
    if not conn:
        return False
    
    cursor = conn.cursor()
    
    statements = read_migration()
    print(f'📋 Found {len(statements)} SQL statements\n')
    
    failed_at = None
    executed = 0
    
    for i, stmt in enumerate(statements, 1):
        # Extract label
        if 'CREATE TABLE' in stmt:
            table_match = stmt.split('CREATE TABLE')[1].split('(')[0].strip().split()
            if len(table_match) > 1:
                label = table_match[-1]
            else:
                label = table_match[0] if table_match else "unknown"
        elif 'CREATE INDEX' in stmt:
            label = stmt.split('ON')[0].split()[-1]
        elif 'CREATE' in stmt and 'VIEW' in stmt:
            label = stmt.split('VIEW')[1].split('AS')[0].strip().split()[-1]
        else:
            label = stmt[:50]
        
        try:
            print(f'[{i}/{len(statements)}] {label}... ', end='', flush=True)
            cursor.execute(stmt)
            conn.commit()
            print('✅')
            executed += 1
        except Exception as e:
            print(f'❌ ERROR')
            print(f'\n❌ FAILED AT STATEMENT {i}/{len(statements)}')
            print(f'Label: {label}')
            print(f'Error: {str(e)}')
            print(f'\nSQL (first 200 chars):\n{stmt[:200]}...\n')
            failed_at = i
            break
    
    cursor.close()
    conn.close()
    
    print('\n' + '='*60)
    if failed_at:
        print(f'❌ Migration failed at statement {failed_at}')
        print(f'✅ Executed: {executed}/{len(statements)-1}')
        return False
    else:
        print(f'✅ Migration completed successfully')
        print(f'✅ Executed: {executed}/{len(statements)} statements')
        return True

if __name__ == '__main__':
    success = test_migration()
    exit(0 if success else 1)
