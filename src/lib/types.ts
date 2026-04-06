export interface Workout {
  id: string;
  user_id: string;
  name: string;
  date: string;
  notes: string | null;
  created_at: string;
  exercises?: Exercise[];
}

export interface Exercise {
  id: string;
  workout_id: string;
  name: string;
  order_index: number;
  sets?: Set[];
}

export interface Set {
  id: string;
  exercise_id: string;
  weight: number;
  reps: number;
  order_index: number;
  is_completed: boolean;
}