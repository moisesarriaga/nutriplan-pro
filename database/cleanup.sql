-- Database Cleanup Script
-- This script removes all test data while preserving the database schema

-- WARNING: This will delete ALL user data. Use with caution!
-- Run this in your Supabase SQL Editor

-- 1. Clear shopping cart items
DELETE FROM lista_precos_mercado;

-- 2. Clear meal plan entries
DELETE FROM cardapio_semanal;

-- 3. Clear favorite recipes
DELETE FROM receitas_favoritas;

-- 4. Clear ingredients
DELETE FROM ingredientes;

-- 5. Clear recipes
DELETE FROM receitas;

-- 6. Clear notifications
DELETE FROM notificacoes;

-- 7. Clear leads (email signups from landing page)
DELETE FROM leads;

-- 8. Reset user profiles (keeps auth users but clears profile data)
-- Option A: Clear all profile data but keep the user accounts
UPDATE perfis_usuario 
SET 
  nome = NULL,
  peso = NULL,
  altura = NULL,
  idade = NULL,
  genero = NULL,
  nivel_atividade = NULL,
  objetivo = NULL,
  meta_calorias = NULL,
  meta_agua = NULL,
  consumo_agua_hoje = 0,
  preferencias_alimentares = NULL,
  restricoes = NULL;

-- Option B: Delete all user profiles (uncomment if you want to delete everything)
-- DELETE FROM perfis_usuario;

-- 9. Verify cleanup
SELECT 'lista_precos_mercado' as table_name, COUNT(*) as remaining_rows FROM lista_precos_mercado
UNION ALL
SELECT 'cardapio_semanal', COUNT(*) FROM cardapio_semanal
UNION ALL
SELECT 'receitas_favoritas', COUNT(*) FROM receitas_favoritas
UNION ALL
SELECT 'ingredientes', COUNT(*) FROM ingredientes
UNION ALL
SELECT 'receitas', COUNT(*) FROM receitas
UNION ALL
SELECT 'notificacoes', COUNT(*) FROM notificacoes
UNION ALL
SELECT 'leads', COUNT(*) FROM leads
UNION ALL
SELECT 'perfis_usuario', COUNT(*) FROM perfis_usuario;

-- Expected result: All counts should be 0 (except perfis_usuario if using Option A)
