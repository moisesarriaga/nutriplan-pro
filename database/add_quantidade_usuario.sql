-- Add quantidade_usuario column to lista_precos_mercado table
ALTER TABLE lista_precos_mercado 
ADD COLUMN IF NOT EXISTS quantidade_usuario NUMERIC;

-- Update-- Inicializa a nova coluna com NULL para que apareça vazia na UI
UPDATE public.lista_precos_mercado SET quantidade_usuario = NULL WHERE quantidade_usuario IS NULL;

-- SCRIPT PARA ZERAR TODAS AS LISTAS EXISTENTES (Executar manualmente no SQL Editor se desejar limpar tudo):
-- UPDATE public.lista_precos_mercado 
-- SET quantidade_usuario = NULL, 
--     ultimo_preco_informado = NULL, 
--     unidade_preco = '';
