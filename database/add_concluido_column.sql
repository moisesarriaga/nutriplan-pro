-- Add concluido column to lista_precos_mercado table
ALTER TABLE lista_precos_mercado 
ADD COLUMN IF NOT EXISTS concluido BOOLEAN DEFAULT FALSE;

-- Create an index for faster filtering of active/history lists
CREATE INDEX IF NOT EXISTS idx_lista_precos_mercado_concluido 
ON lista_precos_mercado(usuario_id, concluido);
