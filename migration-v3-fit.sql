-- =============================================
-- SIRIUS - Migración v3 (ejecutar en Supabase SQL Editor)
-- Añade columnas de cardio a workouts (para importación .fit)
-- Toda la telemetría vive en la fila workout, sin exercises/sets.
-- =============================================

ALTER TABLE workouts ADD COLUMN IF NOT EXISTS total_cardio_distance DECIMAL(8,2);
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS total_calories INTEGER;
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS avg_heart_rate INTEGER;
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS max_heart_rate INTEGER;
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS avg_pace_seconds_per_km INTEGER;
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS hr_zone_seconds JSONB;
