import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Check, MoreVertical, Trash2, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCalendarStore } from '@/store/calendar-store';
import { updateTask, deleteList } from '@/lib/supabase/services';

interface CalendarGridProps {
  onSelectDate?: (date: Date) => void;
  onCreateList?: (date: Date) => void;
  onEditList?: (list: any) => void;
}

export function CalendarGrid({ onSelectDate, onCreateList, onEditList }: CalendarGridProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const { lists } = useCalendarStore();
  
  const firstDayOfMonth = startOfMonth(currentMonth);
  const lastDayOfMonth = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const handleToggleTask = async (listId: string, taskId: string, completed: boolean) => {
    try {
      // Optimistically update the UI
      useCalendarStore.getState().updateTask(listId, taskId, { completed });
      
      // Then update the database
      await updateTask(taskId, { completed });
    } catch (error) {
      console.error('Error updating task:', error);
      // Revert the UI state if the update fails
      useCalendarStore.getState().updateTask(listId, taskId, { completed: !completed });
    }
  };

  const handleDeleteList = async (listId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this list?')) {
      try {
        await deleteList(listId);
        useCalendarStore.getState().deleteList(listId);
      } catch (error) {
        console.error('Error deleting list:', error);
      }
    }
  };

  const handleEditList = (list: any, e: React.MouseEvent) => {
    e.stopPropagation();
    onEditList?.(list);
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm rounded-md bg-primary/10 hover:bg-primary/20"
          >
            Today
          </button>
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-7 gap-px bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="p-2 text-sm font-medium text-center bg-white dark:bg-gray-900"
          >
            {day}
          </div>
        ))}
        
        {daysInMonth.map((date) => {
          const isCurrentMonth = isSameMonth(date, currentMonth);
          const isCurrentDay = isToday(date);
          const dateStr = format(date, 'yyyy-MM-dd');
          const dayLists = lists.filter(list => list.date === dateStr);
          
          return (
            <div
              key={date.toString()}
              className={cn(
                "min-h-[120px] bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 relative",
                "flex flex-col p-2 transition-colors group",
                {
                  "text-gray-400 dark:text-gray-600": !isCurrentMonth,
                  "ring-2 ring-primary ring-inset": isCurrentDay,
                }
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  "w-6 h-6 flex items-center justify-center rounded-full",
                  isCurrentDay && "bg-primary text-primary-foreground"
                )}>
                  {format(date, 'd')}
                </span>
                <button
                  onClick={() => onCreateList?.(date)}
                  className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Create new list"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              
              <div className="mt-1 space-y-1 overflow-y-auto max-h-[80px] scrollbar-thin">
                {dayLists.map(list => (
                  <div 
                    key={list.id} 
                    className="text-xs relative group/list"
                  >
                    <div className="font-medium flex items-center justify-between">
                      <span>{list.title}</span>
                      <div className="opacity-0 group-hover/list:opacity-100 transition-opacity flex items-center gap-1">
                        <button
                          onClick={(e) => handleEditList(list, e)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                          title="Edit list"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteList(list.id, e)}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-red-500"
                          title="Delete list"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="pl-2 space-y-0.5">
                      {list.tasks.map(task => (
                        <div
                          key={task.id}
                          className="flex items-center gap-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTask(list.id, task.id, !task.completed);
                          }}
                        >
                          <div className={cn(
                            "w-3 h-3 rounded border border-gray-300 flex items-center justify-center",
                            task.completed && "bg-primary border-primary"
                          )}>
                            {task.completed && <Check className="w-2 h-2 text-white" />}
                          </div>
                          <span className={cn(
                            "truncate",
                            task.completed && "line-through text-gray-400"
                          )}>
                            {task.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 