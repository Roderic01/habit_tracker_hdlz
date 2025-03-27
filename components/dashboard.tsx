'use client';

import { useState, useEffect } from 'react';
import { PlusCircle } from 'lucide-react';
import { HabitForm } from './habit-form';
import { EditHabitForm } from './edit-habit-form';
import { HabitList } from './habit-list';
import { HabitGrid } from './habit-grid';
import { fetchHabits, deleteHabit } from '@/lib/database';
import { Habit } from '@/types';

interface DashboardProps {
  userId: string;
}

export function Dashboard({ userId }: DashboardProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState(false);
  const [isEditHabitModalOpen, setIsEditHabitModalOpen] = useState(false);
  const [habitToEdit, setHabitToEdit] = useState<Habit | null>(null);

  useEffect(() => {
    loadHabits();
  }, []);

  async function loadHabits() {
    setIsLoading(true);
    const habitData = await fetchHabits(userId);
    setHabits(habitData);
    setIsLoading(false);
  }

  function handleOpenAddHabitModal() {
    setIsAddHabitModalOpen(true);
  }

  function handleCloseAddHabitModal() {
    setIsAddHabitModalOpen(false);
  }

  function handleOpenEditHabitModal(habit: Habit) {
    setHabitToEdit(habit);
    setIsEditHabitModalOpen(true);
  }

  function handleCloseEditHabitModal() {
    setIsEditHabitModalOpen(false);
    setHabitToEdit(null);
  }

  async function handleDeleteHabit(habitId: string) {
    if (confirm('¿Estás seguro de que deseas eliminar este hábito?')) {
      const success = await deleteHabit(habitId, userId);
      if (success) {
        loadHabits();
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Habit Tracker 🚀</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Registra y visualiza el progreso de tus hábitos diarios con una representación visual a través del tiempo.
        </p>

        {/* Botón Nuevo Hábito en la parte superior */}
        <div className="mb-6">
          <button 
            onClick={handleOpenAddHabitModal}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary/90 font-medium shadow-md border border-primary/20 cursor-pointer transition-all hover:shadow-lg"
          >
            <PlusCircle size={20} />
            <span>Nuevo Hábito</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <HabitList 
              userId={userId} 
              habits={habits} 
              onHabitCompleted={loadHabits}
              onAddHabit={handleOpenAddHabitModal}
              onEditHabit={handleOpenEditHabitModal}
              onDeleteHabit={handleDeleteHabit}
            />
          </div>
          
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold mb-4">Completados</h2>
            <div className="h-full">
              <HabitGrid userId={userId} habits={habits} />
            </div>
          </div>
        </div>
      </div>

      <HabitForm 
        userId={userId} 
        isOpen={isAddHabitModalOpen} 
        onHabitAdded={loadHabits} 
        onClose={handleCloseAddHabitModal} 
      />

      <EditHabitForm 
        userId={userId}
        habit={habitToEdit}
        isOpen={isEditHabitModalOpen}
        onHabitUpdated={loadHabits}
        onClose={handleCloseEditHabitModal}
      />
    </div>
  );
}
