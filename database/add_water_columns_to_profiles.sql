-- Adiciona colunas para controle de água na tabela perfis_usuario
ALTER TABLE public.perfis_usuario 
ADD COLUMN IF NOT EXISTS consumo_agua_hoje INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS meta_agua_ml INTEGER DEFAULT 2000,
ADD COLUMN IF NOT EXISTS lembretes_agua BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS intervalo_agua_minutos INTEGER DEFAULT 120,
ADD COLUMN IF NOT EXISTS hora_inicio_sono TIME DEFAULT '22:00',
ADD COLUMN IF NOT EXISTS hora_fim_sono TIME DEFAULT '07:00',
ADD COLUMN IF NOT EXISTS data_ultimo_reset_agua DATE DEFAULT CURRENT_DATE;

-- Comentários para documentação
COMMENT ON COLUMN public.perfis_usuario.consumo_agua_hoje IS 'Quantidade de água consumida no dia atual (ml)';
COMMENT ON COLUMN public.perfis_usuario.meta_agua_ml IS 'Meta diária de consumo de água (ml)';
COMMENT ON COLUMN public.perfis_usuario.lembretes_agua IS 'Se os lembretes de água estão ativos';
COMMENT ON COLUMN public.perfis_usuario.intervalo_agua_minutos IS 'Intervalo entre lembretes em minutos';
COMMENT ON COLUMN public.perfis_usuario.hora_inicio_sono IS 'Horário de início do período de sono (sem notificações)';
COMMENT ON COLUMN public.perfis_usuario.hora_fim_sono IS 'Horário de fim do período de sono (sem notificações)';
COMMENT ON COLUMN public.perfis_usuario.data_ultimo_reset_agua IS 'Data em que o contador diário foi resetado pela última vez';
