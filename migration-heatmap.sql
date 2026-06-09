-- =============================================
-- SIRIUS - Heatmap Migration
-- Añade soporte para guardar rutas GPS de cardio
-- =============================================

CREATE TABLE IF NOT EXISTS workout_tracks (
  workout_id UUID PRIMARY KEY REFERENCES workouts(id) ON DELETE CASCADE,
  points JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workout_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tracks" ON workout_tracks
  FOR SELECT USING (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid()::text)
  );

CREATE POLICY "Users can insert own tracks" ON workout_tracks
  FOR INSERT WITH CHECK (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid()::text)
  );

CREATE POLICY "Users can update own tracks" ON workout_tracks
  FOR UPDATE USING (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid()::text)
  );

CREATE POLICY "Users can delete own tracks" ON workout_tracks
  FOR DELETE USING (
    workout_id IN (SELECT id FROM workouts WHERE user_id = auth.uid()::text)
  );
