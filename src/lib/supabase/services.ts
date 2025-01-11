import { supabase } from './client';
import type { TaskList, Task } from '@/store/calendar-store';

export async function getLists(userId: string, startDate: Date, endDate: Date) {
  const { data, error } = await supabase
    .from('lists')
    .select(`
      *,
      tasks (*)
    `)
    .eq('user_id', userId)
    .gte('date', startDate.toISOString())
    .lte('date', endDate.toISOString())
    .order('date', { ascending: true });

  if (error) throw error;
  return data as TaskList[];
}

export async function createList(list: Omit<TaskList, 'id' | 'tasks'>, tasks: Omit<Task, 'id' | 'listId'>[]) {
  // Start a Supabase transaction
  const { data: newList, error: listError } = await supabase
    .from('lists')
    .insert([list])
    .select('*')
    .single();

  if (listError) {
    console.error('Supabase error creating list:', listError);
    throw listError;
  }

  if (!newList) {
    throw new Error('No data returned from createList');
  }

  // If there are tasks, create them
  if (tasks.length > 0) {
    const tasksToCreate = tasks.map(task => ({
      title: task.title,
      completed: task.completed,
      list_id: newList.id,
    }));

    const { data: createdTasks, error: tasksError } = await supabase
      .from('tasks')
      .insert(tasksToCreate)
      .select('*');

    if (tasksError) {
      console.error('Supabase error creating tasks:', tasksError);
      // Attempt to clean up the list if task creation fails
      await supabase.from('lists').delete().eq('id', newList.id);
      throw tasksError;
    }

    // Convert the tasks to the frontend format
    const formattedTasks = createdTasks?.map(task => ({
      id: task.id,
      title: task.title,
      completed: task.completed,
      listId: task.list_id,
    }));

    return {
      ...newList,
      tasks: formattedTasks || [],
    };
  }

  return { ...newList, tasks: [] };
}

export async function updateList(listId: string, updates: Partial<TaskList>) {
  const { data, error } = await supabase
    .from('lists')
    .update(updates)
    .eq('id', listId)
    .select()
    .single();

  if (error) throw error;
  return data as TaskList;
}

export async function deleteList(listId: string) {
  const { error } = await supabase
    .from('lists')
    .delete()
    .eq('id', listId);

  if (error) throw error;
}

export async function createTask(task: Omit<Task, 'id'>) {
  const { data, error } = await supabase
    .from('tasks')
    .insert(task)
    .select()
    .single();

  if (error) throw error;
  return data as Task;
}

export async function updateTask(taskId: string, updates: Partial<Task>) {
  const dbUpdates: any = {
    completed: updates.completed,
  };

  if (updates.title) {
    dbUpdates.title = updates.title;
  }

  const { data, error } = await supabase
    .from('tasks')
    .update(dbUpdates)
    .eq('id', taskId)
    .select('*')
    .single();

  if (error) {
    console.error('Supabase error updating task:', error);
    throw error;
  }

  // Convert back to frontend format
  return {
    id: data.id,
    title: data.title,
    completed: data.completed,
    listId: data.list_id,
  } as Task;
}

export async function deleteTask(taskId: string) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) throw error;
}

export async function duplicateList(listId: string, newDate: Date) {
  // Get the original list with tasks
  const { data: originalList, error: fetchError } = await supabase
    .from('lists')
    .select(`
      *,
      tasks (*)
    `)
    .eq('id', listId)
    .single();

  if (fetchError) throw fetchError;

  // Create new list
  const { data: newList, error: listError } = await supabase
    .from('lists')
    .insert({
      title: `${originalList.title} (Copy)`,
      date: newDate.toISOString(),
      user_id: originalList.user_id,
    })
    .select()
    .single();

  if (listError) throw listError;

  // Duplicate tasks
  if (originalList.tasks && originalList.tasks.length > 0) {
    const newTasks = originalList.tasks.map((task: Task) => ({
      title: task.title,
      completed: false,
      list_id: newList.id,
    }));

    const { error: tasksError } = await supabase
      .from('tasks')
      .insert(newTasks);

    if (tasksError) throw tasksError;
  }

  return newList as TaskList;
} 