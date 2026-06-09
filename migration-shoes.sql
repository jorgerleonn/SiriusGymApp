-- =============================================
-- SIRIUS - Migration: Shoes Management
-- =============================================

-- 1. Create Shoes Table
CREATE TABLE shoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  color TEXT,
  total_distance DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Update Workouts Table to link to a shoe
ALTER TABLE workouts 
ADD COLUMN shoe_id UUID REFERENCES shoes(id) ON DELETE SET NULL;

-- 3. RLS for Shoes
ALTER TABLE shoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own shoes" ON shoes
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own shoes" ON shoes
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own shoes" ON shoes
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own shoes" ON shoes
  FOR DELETE USING (auth.uid()::text = user_id);

-- 4. Indices
CREATE INDEX shoes_user_id_idx ON shoes(user_id);
CREATE INDEX workouts_shoe_id_idx ON workouts(shoe_id);
