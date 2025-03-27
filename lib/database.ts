import { supabase } from './supabase';
import { Habit, HabitCompletion } from '@/types';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

// Timezone para Ciudad de México
const TIME_ZONE = 'America/Mexico_City';

// Obtener la fecha actual en la zona horaria de Ciudad de México
function getLocalDate() {
  const now = new Date();
  const zonedDate = toZonedTime(now, TIME_ZONE);
  return zonedDate;
}

// Convertir fecha a string YYYY-MM-DD en zona horaria local
function formatLocalDate(date: Date) {
  const zonedDate = toZonedTime(date, TIME_ZONE);
  return format(zonedDate, 'yyyy-MM-dd');
}

// Habits
export async function fetchHabits(userId: string): Promise<Habit[]> {
  try {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching habits:', error);
    return [];
  }
}

export async function createHabit(name: string, userId: string): Promise<Habit | null> {
  try {
    const { data, error } = await supabase
      .from('habits')
      .insert([
        { name: name.trim(), user_id: userId },
      ])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating habit:', error);
    return null;
  }
}

export async function updateHabit(habitId: string, name: string, userId: string): Promise<Habit | null> {
  try {
    const { data, error } = await supabase
      .from('habits')
      .update({ name: name.trim() })
      .eq('id', habitId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating habit:', error);
    return null;
  }
}

export async function deleteHabit(habitId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId)
      .eq('user_id', userId);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting habit:', error);
    return false;
  }
}

// Habit Completions
export async function fetchCompletions(userId: string, startDate: Date, endDate: Date): Promise<HabitCompletion[]> {
  try {
    const startDateStr = formatLocalDate(startDate);
    const endDateStr = formatLocalDate(endDate);
    
    const { data, error } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDateStr)
      .lte('date', endDateStr);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching completions:', error);
    return [];
  }
}

export async function markHabitComplete(habitId: string, userId: string): Promise<boolean> {
  const today = getLocalDate();
  const dateStr = formatLocalDate(today);
  
  try {
    // Check if already completed for this date
    const { data: existing } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('habit_id', habitId)
      .eq('user_id', userId)
      .eq('date', dateStr)
      .limit(1);
    
    // If not completed, add completion
    if (!existing?.length) {
      const { error } = await supabase
        .from('habit_completions')
        .insert([
          { 
            habit_id: habitId, 
            user_id: userId, 
            date: dateStr,
            completed_at: today.toISOString()
          },
        ]);
      
      if (error) throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error marking habit as complete:', error);
    return false;
  }
}

export async function removeHabitCompletion(habitId: string, userId: string, date: Date): Promise<boolean> {
  const dateStr = formatLocalDate(date);
  
  try {
    const { error } = await supabase
      .from('habit_completions')
      .delete()
      .eq('habit_id', habitId)
      .eq('user_id', userId)
      .eq('date', dateStr);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing habit completion:', error);
    return false;
  }
}

// Obtener completados del día de hoy
export async function fetchTodayCompletions(userId: string): Promise<HabitCompletion[]> {
  try {
    const today = getLocalDate();
    const dateStr = formatLocalDate(today);
    
    const { data, error } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', userId)
      .eq('date', dateStr);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error obteniendo completados de hoy:', error);
    return [];
  }
}
