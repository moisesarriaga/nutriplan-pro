-- COMPREHENSIVE FIX FOR DUPLICATE KEY CONSTRAINT
-- Run this entire script in Supabase SQL Editor

-- Step 1: Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Step 2: Add id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'lista_precos_mercado' AND column_name = 'id'
    ) THEN
        ALTER TABLE lista_precos_mercado 
        ADD COLUMN id UUID DEFAULT uuid_generate_v4();
        
        -- Update existing rows to have unique IDs
        UPDATE lista_precos_mercado SET id = uuid_generate_v4() WHERE id IS NULL;
        
        -- Make id NOT NULL
        ALTER TABLE lista_precos_mercado ALTER COLUMN id SET NOT NULL;
    END IF;
END $$;

-- Step 3: Drop ALL existing primary key constraints
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'lista_precos_mercado'::regclass 
        AND contype = 'p'
    LOOP
        EXECUTE 'ALTER TABLE lista_precos_mercado DROP CONSTRAINT ' || constraint_name;
    END LOOP;
END $$;

-- Step 4: Add new primary key on id
ALTER TABLE lista_precos_mercado ADD PRIMARY KEY (id);

-- Step 5: Drop the old unique constraint on (usuario_id, nome_item) if it exists
DO $$ 
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'lista_precos_mercado'::regclass 
        AND contype = 'u'
        AND conname LIKE '%usuario%' OR conname LIKE '%nome_item%'
    LOOP
        EXECUTE 'ALTER TABLE lista_precos_mercado DROP CONSTRAINT ' || constraint_name;
    END LOOP;
END $$;

-- Step 6: Create helpful indexes for queries
CREATE INDEX IF NOT EXISTS idx_lista_usuario_grupo 
ON lista_precos_mercado(usuario_id, grupo_nome);

CREATE INDEX IF NOT EXISTS idx_lista_usuario_item 
ON lista_precos_mercado(usuario_id, nome_item);

CREATE INDEX IF NOT EXISTS idx_lista_grupo 
ON lista_precos_mercado(grupo_nome);

-- Verification: Show current structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lista_precos_mercado'
ORDER BY ordinal_position;
