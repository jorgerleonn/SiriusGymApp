-- =============================================
-- SIRIUS - Esquema de Base de Datos v2
-- Ejecutar en el SQL Editor de Supabase
-- =============================================

-- =============================================
-- TABLAS EXISTENTES (MEJORADAS)
-- =============================================

-- Tabla de workouts (sesiones de entrenamiento)
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL DEFAULT 'strength' CHECK (type IN ('strength', 'cardio', 'hybrid')),
  notes TEXT,
  duration_minutes INTEGER,
  total_cardio_distance DECIMAL(8,2),
  total_calories INTEGER,
  avg_heart_rate INTEGER,
  max_heart_rate INTEGER,
  avg_pace_seconds_per_km INTEGER,
  hr_zone_seconds JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de ejercicios dentro de un workout
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'strength' CHECK (type IN ('strength', 'cardio')),
  muscle_group TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de series (sets) - soporta fuerza y cardio
CREATE TABLE sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  -- Campos de fuerza
  weight DECIMAL(5,2),
  reps INTEGER,
  rir INTEGER CHECK (rir BETWEEN 0 AND 5),
  rpe DECIMAL(3,1) CHECK (rpe BETWEEN 0 AND 10),
  -- Campos de cardio
  distance_meters INTEGER,
  duration_seconds INTEGER,
  pace_seconds_per_km INTEGER,
  heart_rate_zone INTEGER CHECK (heart_rate_zone BETWEEN 1 AND 5),
  -- Comunes
  is_completed BOOLEAN DEFAULT FALSE,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- NUEVAS TABLAS
-- =============================================

-- Plantillas de entrenamiento
CREATE TABLE workout_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'strength' CHECK (type IN ('strength', 'cardio', 'hybrid')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ejercicios dentro de una plantilla
CREATE TABLE template_exercises (
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

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Workouts
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own workouts" ON workouts
  FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own workouts" ON workouts
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own workouts" ON workouts
  FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own workouts" ON workouts
  FOR DELETE USING (auth.uid()::text = user_id);

-- Exercises (a través de workout)
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage exercises" ON exercises
  FOR ALL USING (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid()::text)
  );

-- Sets (a través de exercise -> workout)
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage sets" ON sets
  FOR ALL USING (
    exercise_id IN (
      SELECT e.id FROM exercises e
      JOIN workouts w ON e.workout_id = w.id
      WHERE w.user_id = auth.uid()::text
    )
  );

-- Workout Templates
ALTER TABLE workout_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own templates" ON workout_templates
  FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert own templates" ON workout_templates
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update own templates" ON workout_templates
  FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Users can delete own templates" ON workout_templates
  FOR DELETE USING (auth.uid()::text = user_id);

-- Template Exercises (a través de template)
ALTER TABLE template_exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage template exercises" ON template_exercises
  FOR ALL USING (
    template_id IN (SELECT id FROM workout_templates WHERE user_id = auth.uid()::text)
  );

-- =============================================
-- ÍNDICES
-- =============================================

CREATE INDEX workouts_user_id_idx ON workouts(user_id);
CREATE INDEX workouts_date_idx ON workouts(date DESC);
CREATE INDEX workouts_type_idx ON workouts(type);
CREATE INDEX exercises_workout_id_idx ON exercises(workout_id);
CREATE INDEX exercises_muscle_group_idx ON exercises(muscle_group);
CREATE INDEX sets_exercise_id_idx ON sets(exercise_id);
CREATE INDEX workout_templates_user_id_idx ON workout_templates(user_id);
CREATE INDEX template_exercises_template_id_idx ON template_exercises(template_id);
