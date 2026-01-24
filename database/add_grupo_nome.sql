-- Add grupo_nome column to lista_precos_mercado table
ALTER TABLE lista_precos_mercado 
ADD COLUMN IF NOT EXISTS grupo_nome TEXT;

-- Create an index for faster grouping queries
CREATE INDEX IF NOT EXISTS idx_lista_precos_mercado_grupo_nome 
ON lista_precos_mercado(usuario_id, grupo_nome);
