export interface Habit {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completed_at: string;
  date: string; // format YYYY-MM-DD
}
