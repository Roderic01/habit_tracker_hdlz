'use client';

import React, { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, 
         addDays, addMonths, isToday, isPast, eachDayOfInterval, 
         startOfYear, endOfYear, isSameDay, subMonths, subWeeks,
         addWeeks, subYears, addYears } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, CalendarClock, HelpCircle } from 'lucide-react';
import { fetchCompletions } from '@/lib/database';
import { Habit, HabitCompletion } from '@/types';

type ViewType = 'week' | 'month' | 'quarter' | 'semester' | 'year';

interface HabitGridProps {
  userId: string;
  habits: Habit[];
}

export function HabitGrid({ userId, habits }: HabitGridProps) {
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewType, setViewType] = useState<ViewType>('week');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [dateRange, setDateRange] = useState<{ start: Date; end: Date }>({
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 })
  });
  const [days, setDays] = useState<Date[]>([]);
  
  useEffect(() => {
    updateDateRange(viewType, currentDate);
  }, [viewType, currentDate]);
  
  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      const daysInRange = eachDayOfInterval({
        start: dateRange.start,
        end: dateRange.end
      });
      setDays(daysInRange);
    }
  }, [dateRange]);
  
  useEffect(() => {
    if (habits.length > 0 && dateRange.start && dateRange.end) {
      loadCompletions(dateRange.start, dateRange.end);
    } else {
      setIsLoading(false);
    }
  }, [habits, dateRange]);

  function updateDateRange(view: ViewType, date: Date) {
    let start: Date;
    let end: Date;
    
    switch (view) {
      case 'week':
        start = startOfWeek(date, { weekStartsOn: 1 });
        end = endOfWeek(date, { weekStartsOn: 1 });
        break;
      case 'month':
        start = startOfMonth(date);
        end = endOfMonth(date);
        break;
      case 'quarter':
        // Calcular el inicio del trimestre actual
        start = new Date(date);
        const currentMonth = date.getMonth();
        const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
        start.setMonth(quarterStartMonth);
        start.setDate(1);
        start = new Date(start.setHours(0, 0, 0, 0));
        
        // Fin del trimestre (3 meses después del inicio - 1 día)
        end = new Date(start);
        end = addMonths(end, 3);
        end.setDate(0); // Último día del mes anterior
        end = new Date(end.setHours(23, 59, 59, 999));
        break;
      case 'semester':
        // Primer o segundo semestre
        start = new Date(date);
        start.setMonth(date.getMonth() < 6 ? 0 : 6);
        start.setDate(1);
        start = new Date(start.setHours(0, 0, 0, 0));
        
        // Fin del semestre
        end = new Date(start);
        end = addMonths(end, 6);
        end.setDate(0);
        end = new Date(end.setHours(23, 59, 59, 999));
        break;
      case 'year':
        start = startOfYear(date);
        end = endOfYear(date);
        break;
      default:
        start = startOfWeek(date, { weekStartsOn: 1 });
        end = endOfWeek(date, { weekStartsOn: 1 });
    }
    
    setDateRange({ start, end });
  }

  async function loadCompletions(start: Date, end: Date) {
    setIsLoading(true);
    try {
      const data = await fetchCompletions(userId, start, end);
      setCompletions(data);
    } catch (error) {
      console.error('Error cargando completados:', error);
    } finally {
      setIsLoading(false);
    }
  }

  function getCompletionStatus(habit: Habit, date: Date) {
    const dateStr = format(date, 'yyyy-MM-dd');
    const isCompleted = completions.some(
      completion => completion.habit_id === habit.id && completion.date === dateStr
    );

    if (isCompleted) {
      return 'completed';
    } else if (isPast(date) && !isToday(date)) {
      return 'incomplete';
    } else {
      return 'neutral';
    }
  }
  
  // Función para calcular con precisión el número de días en un periodo
  function calculateDaysInPeriod(viewType: ViewType): number {
    const today = new Date();
    
    switch (viewType) {
      case 'week':
        return 7; // Una semana siempre tiene 7 días
        
      case 'month': {
        // Obtener el último día del mes para saber el número total de días
        const start = new Date(dateRange.start);
        const year = start.getFullYear();
        const month = start.getMonth();
        
        // El último día del mes se obtiene pasando el día 0 del mes siguiente
        const lastDay = new Date(year, month + 1, 0).getDate();
        
        return lastDay;
      }
        
      case 'quarter': {
        // Un trimestre tiene aproximadamente 90-92 días
        // Calcular exactamente basado en el rango de fechas
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        
        // Solo contar hasta hoy si estamos en el trimestre actual
        const countEnd = end > today ? today : end;
        const msInDay = 1000 * 60 * 60 * 24;
        return Math.round((countEnd.getTime() - start.getTime()) / msInDay) + 1;
      }
        
      case 'semester': {
        // Un semestre tiene aproximadamente 181-184 días
        // Si es el primer semestre: 31 + 28/29 + 31 + 30 + 31 + 30 = 181-182 días
        // Si es el segundo semestre: 31 + 31 + 30 + 31 + 30 + 31 = 184 días
        
        // Calcular desde la fecha de inicio hasta la de fin
        const start = new Date(dateRange.start);
        const end = new Date(dateRange.end);
        
        // Para el semestre actual, solo contar hasta hoy
        const countEnd = end > today ? today : end;
        
        // Usar la diferencia en milisegundos para calcular los días exactos
        const msInDay = 1000 * 60 * 60 * 24;
        return Math.round((countEnd.getTime() - start.getTime()) / msInDay) + 1;
      }
        
      case 'year': {
        // Un año tiene 365 o 366 días (año bisiesto)
        const year = dateRange.start.getFullYear();
        const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
        const daysInYear = isLeapYear ? 366 : 365;
        
        // Si estamos en el año actual, solo contar hasta hoy
        if (year === today.getFullYear()) {
          const startOfYear = new Date(year, 0, 1); // 1 de enero del año actual
          const msInDay = 1000 * 60 * 60 * 24;
          return Math.round((today.getTime() - startOfYear.getTime()) / msInDay) + 1;
        }
        
        return daysInYear;
      }
        
      default:
        return 7;
    }
  }

  function getCompletionCount(habit: Habit) {
    // Filtrar completados para este hábito
    const habitCompletions = completions.filter(completion => completion.habit_id === habit.id);
    
    // Contar días únicos completados
    const uniqueDates = new Set(habitCompletions.map(completion => completion.date));
    
    // Obtener el conteo total de días para el periodo actual
    const totalDays = calculateDaysInPeriod(viewType);
    
    return {
      completed: uniqueDates.size,
      total: totalDays
    };
  }
  
  function getCompletionPercentage(habit: Habit) {
    const { completed, total } = getCompletionCount(habit);
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }
  
  function formatDayHeader(day: Date, viewType: ViewType): string {
    switch (viewType) {
      case 'week':
        return format(day, 'EEEEE', { locale: es }).toUpperCase(); // L, M, X, J, V, S, D
      case 'month':
        return format(day, 'd', { locale: es }); // 1-31
      case 'quarter':
      case 'semester':
      case 'year':
        return format(day, 'd/M', { locale: es }); // 1/4, 15/6, etc.
      default:
        return format(day, 'EEEEE', { locale: es }).toUpperCase();
    }
  }
  
  function isToday(date: Date): boolean {
    return isSameDay(date, new Date());
  }

  function calculateOverallCompletionRate(): { completed: number, total: number, percentage: number } {
    // Si no hay hábitos, retornar 0%
    if (habits.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }
    
    // Total de días en el periodo actual
    const totalDaysInPeriod = calculateDaysInPeriod(viewType);
    
    // Total teórico de completados posibles (días en periodo × número de hábitos)
    const totalPossibleCompletions = totalDaysInPeriod * habits.length;
    
    // Contar completados únicos por día y hábito
    let totalCompletedDays = 0;
    
    // Realizar conteo para cada hábito
    habits.forEach(habit => {
      const habitCompletions = completions.filter(completion => completion.habit_id === habit.id);
      const uniqueDates = new Set(habitCompletions.map(completion => completion.date));
      totalCompletedDays += uniqueDates.size;
    });
    
    // Calcular porcentaje
    const percentage = totalPossibleCompletions > 0 
      ? Math.round((totalCompletedDays / totalPossibleCompletions) * 100)
      : 0;
    
    return {
      completed: totalCompletedDays,
      total: totalPossibleCompletions,
      percentage
    };
  }

  function goToPreviousPeriod() {
    const date = new Date(currentDate);
    
    switch (viewType) {
      case 'week':
        setCurrentDate(subWeeks(date, 1));
        break;
      case 'month':
        setCurrentDate(subMonths(date, 1));
        break;
      case 'quarter':
        setCurrentDate(subMonths(date, 3));
        break;
      case 'semester':
        setCurrentDate(subMonths(date, 6));
        break;
      case 'year':
        setCurrentDate(subYears(date, 1));
        break;
    }
  }

  function goToNextPeriod() {
    const date = new Date(currentDate);
    
    switch (viewType) {
      case 'week':
        setCurrentDate(addWeeks(date, 1));
        break;
      case 'month':
        setCurrentDate(addMonths(date, 1));
        break;
      case 'quarter':
        setCurrentDate(addMonths(date, 3));
        break;
      case 'semester':
        setCurrentDate(addMonths(date, 6));
        break;
      case 'year':
        setCurrentDate(addYears(date, 1));
        break;
    }
  }

  function goToCurrentPeriod() {
    setCurrentDate(new Date());
  }

  if (isLoading) {
    return <div className="text-center py-4">Cargando datos de hábitos...</div>;
  }

  if (habits.length === 0) {
    return <div className="text-center py-8 text-gray-500">Añade hábitos para visualizar tu progreso</div>;
  }
  
  return (
    <div className={`view-${viewType}`}>
      <div className="flex flex-wrap justify-between items-center mb-4">
        <div className="flex flex-wrap gap-2">
          <button 
            className={`px-3 py-1 rounded-full text-sm ${viewType === 'week' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
            onClick={() => setViewType('week')}
          >
            Semana
          </button>
          <button 
            className={`px-3 py-1 rounded-full text-sm ${viewType === 'month' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
            onClick={() => setViewType('month')}
          >
            Mes
          </button>
          <button 
            className={`px-3 py-1 rounded-full text-sm ${viewType === 'quarter' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
            onClick={() => setViewType('quarter')}
          >
            Trimestre
          </button>
          <button 
            className={`px-3 py-1 rounded-full text-sm ${viewType === 'semester' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
            onClick={() => setViewType('semester')}
          >
            Semestre
          </button>
          <button 
            className={`px-3 py-1 rounded-full text-sm ${viewType === 'year' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700'}`}
            onClick={() => setViewType('year')}
          >
            Año
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={goToPreviousPeriod}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Periodo anterior"
          >
            <ChevronLeft size={18} />
          </button>
          
          <button
            onClick={goToCurrentPeriod}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Periodo actual"
          >
            <CalendarClock size={18} />
          </button>
          
          <button 
            onClick={goToNextPeriod}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
            title="Periodo siguiente"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      
      <div className="overflow-auto">
        {days.length > 0 && (
          <div className="text-xs text-gray-500 mb-2 flex justify-between items-center">
            <span className="flex items-center gap-1">
              {format(dateRange.start, 'PPP', { locale: es })} - {format(dateRange.end, 'PPP', { locale: es })}
              <div className="relative group">
                <HelpCircle size={16} className="text-gray-400 cursor-help ml-2" />
                <div className="absolute left-0 bottom-full mb-2 min-w-60 bg-gray-800 text-white text-xs p-2 rounded hidden group-hover:block z-50 shadow-lg">
                  <p className="font-semibold mb-1">Resumen del periodo:</p>
                  {(() => {
                    const { completed, total, percentage } = calculateOverallCompletionRate();
                    return (
                      <>
                        <p>
                          {viewType === 'week' ? 'Esta semana' : 
                           viewType === 'month' ? 'Este mes' :
                           viewType === 'quarter' ? 'Este trimestre' :
                           viewType === 'semester' ? 'Este semestre' : 'Este año'}:
                        </p>
                        <p className="font-bold">Todos los hábitos: {completed}/{total} completados ({percentage}%)</p>
                        <div className="w-full bg-gray-600 h-2 rounded-full mt-1">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <p className="mt-2 text-xs text-gray-300">
                          Este porcentaje representa el total de hábitos completados en relación al número total de días 
                          multiplicado por el número de hábitos en el periodo.
                        </p>
                      </>
                    );
                  })()}
                </div>
              </div>
            </span>
          </div>
        )}
        
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border pl-2 pr-3 py-1 sticky-col whitespace-nowrap">{viewType !== 'week' ? 'Hábito' : ''}</th>
              {(viewType === 'year' || viewType === 'semester') && days.length > 100 ? (
                // Para vistas año/semestre, mostrar encabezados de mes
                Array.from({ length: viewType === 'year' ? 12 : 6 }, (_, monthIndex) => {
                  // Calcular el mes correcto basado en el rango de fechas
                  const monthDate = new Date(dateRange.start);
                  monthDate.setMonth(dateRange.start.getMonth() + monthIndex);
                  
                  // Solo mostrar meses que están dentro del rango de fechas
                  if (monthDate > dateRange.end) return null;
                  
                  return (
                    <th 
                      key={`month-${monthIndex}`} 
                      className="border p-1 text-center text-xs"
                    >
                      {format(monthDate, 'MMMM', { locale: es })}
                    </th>
                  );
                }).filter(Boolean)
              ) : days.length <= 100 ? (
                days.map((day, index) => (
                  <th 
                    key={index} 
                    className={`border p-0 text-center text-xs ${isToday(day) ? 'bg-primary/10' : ''}`}
                  >
                    {formatDayHeader(day, viewType)}
                  </th>
                ))
              ) : null}
            </tr>
          </thead>
          <tbody>
            {habits.map(habit => (
              <tr key={habit.id}>
                <td className="border pl-2 pr-3 py-1 font-medium sticky-col whitespace-nowrap w-auto">
                  <div className="flex items-center gap-1">
                    <span>{habit.name}</span>
                    <div className="relative group">
                      <HelpCircle size={16} className="text-gray-400 cursor-help" />
                      <div className="absolute left-0 bottom-full mb-2 min-w-48 bg-gray-800 text-white text-xs p-2 rounded hidden group-hover:block z-50 shadow-lg">
                        <p className="font-semibold mb-1">Estadísticas de completado:</p>
                        {(() => {
                          const { completed, total } = getCompletionCount(habit);
                          const percentage = getCompletionPercentage(habit);
                          return (
                            <>
                              <p>
                                {viewType === 'week' ? 'Esta semana' : 
                                 viewType === 'month' ? 'Este mes' :
                                 viewType === 'quarter' ? 'Este trimestre' :
                                 viewType === 'semester' ? 'Este semestre' : 'Este año'}:
                              </p>
                              <p className="font-bold">{completed}/{total} días ({percentage}%)</p>
                              <div className="w-full bg-gray-600 h-2 rounded-full mt-1">
                                <div 
                                  className="bg-primary h-2 rounded-full" 
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </td>
                {(viewType === 'year' || viewType === 'semester') && days.length > 100 ? (
                  // Vista anual y semestral: agrupar días por mes para optimizar la visualización
                  Array.from({ length: viewType === 'year' ? 12 : 6 }, (_, monthIndex) => {
                    // Para vista semestral, ajustar el índice de mes según el semestre actual
                    const monthDate = new Date(dateRange.start);
                    monthDate.setMonth(dateRange.start.getMonth() + monthIndex);
                    
                    // Solo procesar meses dentro del rango de fechas
                    if (monthDate > dateRange.end) return null;
                    
                    const currentMonth = monthDate.getMonth();
                    const monthDays = days.filter(day => day.getMonth() === currentMonth);
                    
                    if (monthDays.length === 0) return null;
                    
                    // Agrupar días por semanas para mejorar la visualización
                    const weeksInMonth: Date[][] = [];
                    let currentWeek: Date[] = [];
                    
                    // Ordenar los días del mes
                    const sortedDays = [...monthDays].sort((a, b) => a.getTime() - b.getTime());
                    
                    // Agrupar en columnas de máximo 7 días (una semana)
                    sortedDays.forEach((day, idx) => {
                      currentWeek.push(day);
                      if (currentWeek.length >= 7 || idx === sortedDays.length - 1) {
                        weeksInMonth.push([...currentWeek]);
                        currentWeek = [];
                      }
                    });
                    
                    return (
                      <td 
                        key={`month-${monthIndex}`} 
                        className="border p-2 align-top"
                      >
                        <div className="flex gap-1 justify-center">
                          {weeksInMonth.map((week, weekIdx) => (
                            <div key={`week-${weekIdx}`} className="flex flex-col gap-0.5">
                              {week.map((day, dayIdx) => {
                                const status = getCompletionStatus(habit, day);
                                return (
                                  <div 
                                    key={dayIdx}
                                    className={`w-2 h-2 rounded-sm habit-cell-${status} ${isToday(day) ? 'today' : ''}`}
                                    title={`${habit.name} - ${format(day, 'PPP', { locale: es })}`}
                                  ></div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </td>
                    );
                  }).filter(Boolean)
                ) : (
                  // Vistas con menos días: mostrar cada día individualmente
                  days.map((day, dayIndex) => {
                    const status = getCompletionStatus(habit, day);
                    const cellSize = viewType === 'week' ? 'w-8 h-8' : 
                                    viewType === 'month' ? 'w-5 h-5' :
                                    viewType === 'quarter' ? 'w-4 h-4' : 'w-3 h-3';
                                    
                    return (
                      <td 
                        key={dayIndex} 
                        className={`border p-0 habit-cell-${status} ${isToday(day) ? 'today' : ''}`}
                        title={`${habit.name} - ${format(day, 'PPP', { locale: es })}`}
                      >
                        <div className={`aspect-square ${cellSize}`}></div>
                      </td>
                    );
                  })
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <style jsx>{`
          .sticky-col {
            width: 1%;
            white-space: nowrap;
            padding-right: 12px; /* Espacio estético */
          }
        `}</style>
      </div>
    </div>
  );
}
