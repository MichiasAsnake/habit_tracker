import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { X, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCalendarStore } from '@/store/calendar-store';
import { createList, updateList, deleteTask } from '@/lib/supabase/services';

interface CreateListModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  existingList?: any;
}

export function CreateListModal({ isOpen, onClose, date, existingList }: CreateListModalProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [tasks, setTasks] = useState<{ id?: string; title: string; completed: boolean }[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (existingList) {
      setTitle(existingList.title);
      setTasks(existingList.tasks.map((task: any) => ({
        id: task.id,
        title: task.title,
        completed: task.completed
      })));
    } else {
      setTitle('');
      setTasks([]);
    }
  }, [existingList]);

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      setTasks([...tasks, { title: newTaskTitle.trim(), completed: false }]);
      setNewTaskTitle('');
    }
  };

  const handleRemoveTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTask();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      if (existingList) {
        // Update existing list
        const updatedList = await updateList(existingList.id, {
          title,
          date: format(date, 'yyyy-MM-dd'),
        });

        // Handle tasks updates
        const existingTaskIds = new Set(existingList.tasks.map((t: any) => t.id));
        const updatedTasks = tasks.filter(t => t.id); // Tasks that already exist
        const newTasks = tasks.filter(t => !t.id); // New tasks to be created

        // Delete tasks that were removed
        const tasksToDelete = existingList.tasks.filter((t: any) => 
          !tasks.some(updatedTask => updatedTask.id === t.id)
        );

        for (const task of tasksToDelete) {
          await deleteTask(task.id);
        }

        useCalendarStore.getState().updateList(existingList.id, {
          ...updatedList,
          tasks: [...updatedTasks, ...newTasks]
        });
      } else {
        // Create new list
        const newList = await createList(
          {
            title,
            date: format(date, 'yyyy-MM-dd'),
            user_id: user.id
          },
          tasks
        );
        useCalendarStore.getState().addList(newList);
      }

      onClose();
    } catch (error) {
      console.error('Error saving list:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-full max-w-md">
        <div className="p-4 border-b dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            {existingList ? 'Edit List' : 'Create New List'} - {format(date, 'MMM d, yyyy')}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              List Title
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md dark:bg-gray-800 dark:border-gray-700"
              placeholder="Enter list title"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Tasks</label>
            <div className="space-y-2">
              {tasks.map((task, index) => (
                <div key={task.id || index} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={task.title}
                    onChange={(e) => {
                      const newTasks = [...tasks];
                      newTasks[index].title = e.target.value;
                      setTasks(newTasks);
                    }}
                    className="flex-1 px-3 py-1 border rounded-md text-sm dark:bg-gray-800 dark:border-gray-700"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveTask(index)}
                    className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add a new task"
                  className="flex-1 px-3 py-1 border rounded-md text-sm dark:bg-gray-800 dark:border-gray-700"
                />
                <button
                  type="button"
                  onClick={handleAddTask}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : existingList ? 'Update List' : 'Create List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 