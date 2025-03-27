'use client';

import { useState, useEffect } from 'react';
import { Check, Pencil, Trash, X } from 'lucide-react';
import { markHabitComplete, removeHabitCompletion, fetchTodayCompletions } from '@/lib/database';
import { Habit, HabitCompletion } from '@/types';

interface HabitListProps {
  userId: string;
  habits: Habit[];
  onHabitCompleted: () => void;
  onAddHabit: () => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => void;
}

export function HabitList({ 
  userId, 
  habits, 
  onHabitCompleted, 
  onAddHabit,
  onEditHabit,
  onDeleteHabit
}: HabitListProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [completingHabitId, setCompletingHabitId] = useState<string | null>(null);
  const [completedHabits, setCompletedHabits] = useState<string[]>([]);

  useEffect(() => {
    loadTodayCompletions();
  }, [habits]);

  async function loadTodayCompletions() {
    if (habits.length === 0) return;
    
    const todayCompletions = await fetchTodayCompletions(userId);
    const completedIds = todayCompletions.map((completion: HabitCompletion) => completion.habit_id);
    setCompletedHabits(completedIds);
  }

  const handleToggleCompletion = async (habitId: string) => {
    setIsLoading(true);
    setCompletingHabitId(habitId);
    
    try {
      // Si ya está completado, descompletar
      if (completedHabits.includes(habitId)) {
        const now = new Date();
        await removeHabitCompletion(habitId, userId, now);
        setCompletedHabits(prev => prev.filter(id => id !== habitId));
      } else {
        // Si no está completado, completar
        await markHabitComplete(habitId, userId);
        setCompletedHabits(prev => [...prev, habitId]);
      }
      
      onHabitCompleted();
    } catch (error) {
      console.error('Error al cambiar estado del hábito:', error);
    } finally {
      setIsLoading(false);
      setCompletingHabitId(null);
    }
  };

  return (
    <div className="border rounded-md bg-card-bg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Mis Hábitos</h2>
      </div>

      {habits.length === 0 ? (
        <p className="text-center py-6 text-gray-500 dark:text-gray-400">
          No tienes hábitos todavía. ¡Crea uno nuevo para empezar!
        </p>
      ) : (
        <ul className="space-y-3">
          {habits.map((habit) => {
            const isCompleted = completedHabits.includes(habit.id);
            
            return (
              <li key={habit.id} className="flex items-center justify-between gap-2 p-3 bg-background rounded-md">
                <span>{habit.name}</span>
                <div className="flex gap-2">
                  <button
                    className="p-1 rounded-full hover:bg-neutral"
                    onClick={() => onEditHabit(habit)}
                    aria-label="Editar hábito"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    className="p-1 rounded-full hover:bg-neutral"
                    onClick={() => onDeleteHabit(habit.id)}
                    aria-label="Eliminar hábito"
                  >
                    <Trash size={16} />
                  </button>
                  <button
                    onClick={() => handleToggleCompletion(habit.id)}
                    disabled={isLoading && completingHabitId === habit.id}
                    className={`${isCompleted ? 'bg-green-600' : 'bg-primary'} text-white px-2 py-1 rounded-md text-sm hover:opacity-90 flex items-center gap-1`}
                  >
                    {isCompleted ? <X size={14} /> : <Check size={14} />}
                    <span>{isCompleted ? 'Deshacer' : 'Completar'}</span>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
