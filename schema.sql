-- =============================================
-- SIRIUS - Esquema de Base de Datos
-- Ejecutar en el SQL Editor de Supabase
-- =============================================

-- =============================================
-- TABLAS
-- =============================================

-- Tabla de workouts (sesiones de entrenamiento)
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de ejercicios dentro de un workout
CREATE TABLE exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de series (sets) dentro de un ejercicio
CREATE TABLE sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  weight DECIMAL(5,2) NOT NULL,
  reps INTEGER NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;

-- Política para workouts
CREATE POLICY "Users can view own workouts" ON workouts
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own workouts" ON workouts
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own workouts" ON workouts
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own workouts" ON workouts
  FOR DELETE USING (auth.uid()::text = user_id);

-- Política para exercises (a través de workout)
CREATE POLICY "Users can manage exercises" ON exercises
  FOR ALL USING (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid()::text)
  );

-- Política para sets (a través de exercise -> workout)
CREATE POLICY "Users can manage sets" ON sets
  FOR ALL USING (
    exercise_id IN (
      SELECT e.id FROM exercises e
      JOIN workouts w ON e.workout_id = w.id
      WHERE w.user_id = auth.uid()::text
    )
  );

-- =============================================
-- ÍNDICES
-- =============================================

CREATE INDEX workouts_user_id_idx ON workouts(user_id);
CREATE INDEX workouts_date_idx ON workouts(date DESC);
CREATE INDEX exercises_workout_id_idx ON exercises(workout_id);
CREATE INDEX sets_exercise_id_idx ON sets(exercise_id);