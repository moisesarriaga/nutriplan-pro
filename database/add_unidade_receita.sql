-- Add unidade_receita column to lista_precos_mercado table
-- This column stores the ORIGINAL unit from the recipe and should never be changed by user edits
ALTER TABLE lista_precos_mercado 
ADD COLUMN IF NOT EXISTS unidade_receita TEXT;

-- Copy existing unidade_preco values to unidade_receita to preserve original recipe units
-- This ensures existing items show the correct recipe unit
UPDATE lista_precos_mercado 
SET unidade_receita = unidade_preco 
WHERE unidade_receita IS NULL;

-- Note: For new items added from recipes, both unidade_receita and unidade_preco 
-- will be set to the recipe's unit initially. Users can then edit unidade_preco 
-- without affecting the displayed recipe information.
