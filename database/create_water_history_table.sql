-- Create table for water consumption history
CREATE TABLE IF NOT EXISTS public.historico_consumo_agua (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    data DATE NOT NULL,
    quantidade_ml INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(usuario_id, data)
);

-- Enable RLS
ALTER TABLE public.historico_consumo_agua ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert their own water history"
ON public.historico_consumo_agua
FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can update their own water history"
ON public.historico_consumo_agua
FOR UPDATE
USING (auth.uid() = usuario_id);

CREATE POLICY "Users can view their own water history"
ON public.historico_consumo_agua
FOR SELECT
USING (auth.uid() = usuario_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_historico_consumo_agua_updated_at
    BEFORE UPDATE ON public.historico_consumo_agua
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
