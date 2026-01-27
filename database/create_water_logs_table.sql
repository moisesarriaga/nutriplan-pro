-- Create table for detailed water logs
CREATE TABLE IF NOT EXISTS public.water_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quantidade_ml INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.water_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can insert their own water logs"
ON public.water_logs
FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Users can view their own water logs"
ON public.water_logs
FOR SELECT
USING (auth.uid() = usuario_id);

CREATE POLICY "Users can delete their own water logs"
ON public.water_logs
FOR DELETE
USING (auth.uid() = usuario_id);
