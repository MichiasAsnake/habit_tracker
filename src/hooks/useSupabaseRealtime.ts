import { useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useCalendarStore } from '@/store/calendar-store';
import type { TaskList, Task } from '@/store/calendar-store';

export function useSupabaseRealtime() {
  const { addList, updateList, deleteList, addTask, updateTask, deleteTask } = useCalendarStore();

  useEffect(() => {
    // Subscribe to lists changes
    const listsSubscription = supabase
      .channel('lists-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lists',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            addList(payload.new as TaskList);
          } else if (payload.eventType === 'UPDATE') {
            updateList(payload.old.id, payload.new as TaskList);
          } else if (payload.eventType === 'DELETE') {
            deleteList(payload.old.id);
          }
        }
      )
      .subscribe();

    // Subscribe to tasks changes
    const tasksSubscription = supabase
      .channel('tasks-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const task = payload.new as Task;
            addTask(task.listId, task);
          } else if (payload.eventType === 'UPDATE') {
            const task = payload.new as Task;
            updateTask(task.listId, payload.old.id, task);
          } else if (payload.eventType === 'DELETE') {
            const task = payload.old as Task;
            deleteTask(task.listId, task.id);
          }
        }
      )
      .subscribe();

    return () => {
      listsSubscription.unsubscribe();
      tasksSubscription.unsubscribe();
    };
  }, [addList, updateList, deleteList, addTask, updateTask, deleteTask]);
} 