import { useState } from 'react';
import { format } from 'date-fns';
import { X, Plus, Trash2 } from 'lucide-react';
import { createList } from '@/lib/supabase/services';
import { useCalendarStore } from '@/store/calendar-store';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface CreateListModalProps {
  date: Date;
  isOpen: boolean;
  onClose: () => void;
}

interface TaskInput {
  id: string;
  title: string;
}

export function CreateListModal({ date, isOpen, onClose }: CreateListModalProps) {
  const [title, setTitle] = useState('');
  const [tasks, setTasks] = useState<TaskInput[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  if (!isOpen) return null;

  const handleAddTask = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newTaskTitle.trim()) return;

    setTasks([...tasks, { id: crypto.randomUUID(), title: newTaskTitle.trim() }]);
    setNewTaskTitle('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTask();
    }
  };

  const handleRemoveTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !user) return;

    setIsLoading(true);
    try {
      const newList = await createList(
        {
          title: title.trim(),
          date: format(date, 'yyyy-MM-dd'),
          user_id: user.id,
        },
        tasks.map(task => ({ title: task.title, completed: false }))
      );
      
      // Add the list with tasks to the store
      useCalendarStore.getState().addList({
        ...newList,
        tasks: tasks.map(task => ({
          id: task.id,
          title: task.title,
          completed: false,
          listId: newList.id,
        })),
      });
      
      onClose();
    } catch (error) {
      console.error('Error creating list:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">
            Create List for {format(date, 'MMMM d, yyyy')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-1">
              List Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter list title..."
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tasks</label>
            <div className="space-y-2">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 group bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md"
                >
                  <span className="flex-1">{task.title}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-opacity"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Add a new task..."
                  className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
                <button
                  type="button"
                  onClick={() => handleAddTask()}
                  className="p-2 bg-primary/10 hover:bg-primary/20 rounded-md"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !title.trim()}
              className={cn(
                "px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {isLoading ? 'Creating...' : 'Create List'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 