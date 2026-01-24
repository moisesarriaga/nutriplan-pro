-- SOLUÇÃO DEFINITIVA PARA DUPLICATE KEY 
-- Copie e cole TODO este código no SQL Editor do Supabase

BEGIN;

-- 1. Garantir que a extensão de UUID existe
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Remover TODAS as chaves primárias e constraints únicas que possam existir
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'lista_precos_mercado'::regclass 
        AND contype IN ('p', 'u')
    ) LOOP
        EXECUTE 'ALTER TABLE lista_precos_mercado DROP CONSTRAINT IF EXISTS ' || quote_ident(r.conname) || ' CASCADE';
    END LOOP;
END $$;

-- 3. Adicionar coluna ID se não existir, ou garantir que ela seja UUID
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lista_precos_mercado' AND column_name = 'id') THEN
        ALTER TABLE lista_precos_mercado ADD COLUMN id UUID DEFAULT uuid_generate_v4();
    END IF;
END $$;

-- 4. Preencher IDs nulos com valores únicos
UPDATE lista_precos_mercado SET id = uuid_generate_v4() WHERE id IS NULL;

-- 5. Tornar a coluna ID obrigatória e transformá-la na nova Chave Primária
ALTER TABLE lista_precos_mercado ALTER COLUMN id SET NOT NULL;
ALTER TABLE lista_precos_mercado ADD PRIMARY KEY (id);

-- 6. Adicionar coluna grupo_nome se não existir (garantia)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'lista_precos_mercado' AND column_name = 'grupo_nome') THEN
        ALTER TABLE lista_precos_mercado ADD COLUMN grupo_nome TEXT;
    END IF;
END $$;

-- 7. Criar índices para manter a performance rápida
CREATE INDEX IF NOT EXISTS idx_shopping_user_group ON lista_precos_mercado(usuario_id, grupo_nome);

COMMIT;

-- Verificação final:
SELECT 
    conname as constraint_name, 
    contype as type 
FROM pg_constraint 
WHERE conrelid = 'lista_precos_mercado'::regclass;
