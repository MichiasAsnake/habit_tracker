import { create } from 'zustand';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  listId: string;
}

export interface TaskList {
  id: string;
  title: string;
  date: string;
  user_id: string;
  tasks: Task[];
}

interface CalendarStore {
  lists: TaskList[];
  selectedDate: Date | null;
  setSelectedDate: (date: Date | null) => void;
  addList: (list: TaskList) => void;
  updateList: (listId: string, updates: Partial<TaskList>) => void;
  deleteList: (listId: string) => void;
  addTask: (listId: string, task: Task) => void;
  updateTask: (listId: string, taskId: string, updates: Partial<Task>) => void;
  deleteTask: (listId: string, taskId: string) => void;
}

export const useCalendarStore = create<CalendarStore>((set) => ({
  lists: [],
  selectedDate: null,
  setSelectedDate: (date) => set({ selectedDate: date }),
  addList: (list) => set((state) => ({ lists: [...state.lists, list] })),
  updateList: (listId, updates) =>
    set((state) => ({
      lists: state.lists.map((list) =>
        list.id === listId ? { ...list, ...updates } : list
      ),
    })),
  deleteList: (listId) =>
    set((state) => ({
      lists: state.lists.filter((list) => list.id !== listId),
    })),
  addTask: (listId, task) =>
    set((state) => ({
      lists: state.lists.map((list) =>
        list.id === listId
          ? { ...list, tasks: [...list.tasks, task] }
          : list
      ),
    })),
  updateTask: (listId, taskId, updates) =>
    set((state) => ({
      lists: state.lists.map((list) =>
        list.id === listId
          ? {
              ...list,
              tasks: list.tasks.map((task) =>
                task.id === taskId ? { ...task, ...updates } : task
              ),
            }
          : list
      ),
    })),
  deleteTask: (listId, taskId) =>
    set((state) => ({
      lists: state.lists.map((list) =>
        list.id === listId
          ? {
              ...list,
              tasks: list.tasks.filter((task) => task.id !== taskId),
            }
          : list
      ),
    })),
})); 