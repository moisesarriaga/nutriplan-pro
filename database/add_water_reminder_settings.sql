-- Add water reminder settings to user profiles
ALTER TABLE perfis_usuario 
ADD COLUMN IF NOT EXISTS intervalo_agua_minutos INTEGER DEFAULT 120,
ADD COLUMN IF NOT EXISTS hora_inicio_sono TIME DEFAULT '22:00:00',
ADD COLUMN IF NOT EXISTS hora_fim_sono TIME DEFAULT '07:00:00';

-- Comment explaining the columns
COMMENT ON COLUMN perfis_usuario.intervalo_agua_minutos IS 'Intervalo entre lembretes de água em minutos';
COMMENT ON COLUMN perfis_usuario.hora_inicio_sono IS 'Horário que o usuário costuma ir dormir (silencia notificações)';
COMMENT ON COLUMN perfis_usuario.hora_fim_sono IS 'Horário que o usuário costuma acordar (retoma notificações)';
