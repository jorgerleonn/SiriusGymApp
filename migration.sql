-- =============================================
-- SIRIUS - Migración v2 (ejecutar en Supabase SQL Editor)
-- Añade soporte para cardio, RIR/RPE, músculos y plantillas
-- =============================================

-- 1. Workouts: nuevo tipo y duración
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'strength' CHECK (type IN ('strength', 'cardio', 'hybrid'));
ALTER TABLE workouts ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- 2. Exercises: tipo, grupo muscular y notas
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'strength' CHECK (type IN ('strength', 'cardio'));
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS muscle_group TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS notes TEXT;

-- 3. Sets: RIR/RPE para fuerza + distancia/duración/ritmo/zona para cardio
ALTER TABLE sets ADD COLUMN IF NOT EXISTS rir INTEGER CHECK (rir BETWEEN 0 AND 5);
ALTER TABLE sets ADD COLUMN IF NOT EXISTS rpe DECIMAL(3,1) CHECK (rpe BETWEEN 0 AND 10);
ALTER TABLE sets ADD COLUMN IF NOT EXISTS distance_meters INTEGER;
ALTER TABLE sets ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;
ALTER TABLE sets ADD COLUMN IF NOT EXISTS pace_seconds_per_km INTEGER;
ALTER TABLE sets ADD COLUMN IF NOT EXISTS heart_rate_zone INTEGER CHECK (heart_rate_zone BETWEEN 1 AND 5);

-- 4. Plantillas de entrenamiento
CREATE TABLE IF NOT EXISTS workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'strength' CHECK (type IN ('strength', 'cardio', 'hybrid')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS template_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES workout_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'strength' CHECK (type IN ('strength', 'cardio')),
  muscle_group TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  default_sets INTEGER DEFAULT 3,
  default_reps INTEGER DEFAULT 10,
  default_weight DECIMAL(5,2),
  notes TEXT
);

-- 5. Row Level Security para plantillas
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_exercises ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own templates" ON workout_templates;
CREATE POLICY "Users can view own templates" ON workout_templates
  FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own templates" ON workout_templates;
CREATE POLICY "Users can insert own templates" ON workout_templates
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own templates" ON workout_templates;
CREATE POLICY "Users can update own templates" ON workout_templates
  FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can delete own templates" ON workout_templates;
CREATE POLICY "Users can delete own templates" ON workout_templates
  FOR DELETE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can manage template exercises" ON template_exercises;
CREATE POLICY "Users can manage template exercises" ON template_exercises
  FOR ALL USING (
    template_id IN (SELECT id FROM workout_templates WHERE user_id = auth.uid()::text)
  );

-- 6. Índices
CREATE INDEX IF NOT EXISTS workouts_type_idx ON workouts(type);
CREATE INDEX IF NOT EXISTS exercises_muscle_group_idx ON exercises(muscle_group);
CREATE INDEX IF NOT EXISTS workout_templates_user_id_idx ON workout_templates(user_id);
CREATE INDEX IF NOT EXISTS template_exercises_template_id_idx ON template_exercises(template_id);
