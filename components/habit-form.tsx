'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { createHabit } from '@/lib/database';

interface HabitFormProps {
  userId: string;
  isOpen: boolean;
  onHabitAdded: () => void;
  onClose: () => void;
}

export function HabitForm({ userId, isOpen, onHabitAdded, onClose }: HabitFormProps) {
  const [habitName, setHabitName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!habitName.trim()) return;
    
    setIsLoading(true);
    try {
      await createHabit(habitName, userId);
      onHabitAdded();
      setHabitName('');
      onClose();
    } catch (error) {
      console.error('Error al crear hábito:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card-bg p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Nuevo Hábito</h2>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-neutral rounded-full"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={habitName}
            onChange={(e) => setHabitName(e.target.value)}
            placeholder="Nombre del hábito..."
            className="w-full px-4 py-2 border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
            autoFocus
          />
          
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-neutral"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
              disabled={isLoading || !habitName.trim()}
            >
              Añadir Hábito
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
