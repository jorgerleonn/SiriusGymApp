-- =============================================
-- SIRIUS - Migración v4 (ejecutar en Supabase SQL Editor)
-- Añade columna route_data a workouts para almacenar
-- el trazado GPS de rutas cardio importadas de .fit
-- =============================================

ALTER TABLE workouts ADD COLUMN IF NOT EXISTS route_data JSONB;
