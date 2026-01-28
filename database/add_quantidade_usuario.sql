-- Add quantidade_usuario column to lista_precos_mercado table
ALTER TABLE lista_precos_mercado 
ADD COLUMN IF NOT EXISTS quantidade_usuario NUMERIC;

-- Update-- Inicializa a nova coluna com 0 para que apareça vazia na UI
UPDATE public.lista_precos_mercado SET quantidade_usuario = 0 WHERE quantidade_usuario IS NULL;
