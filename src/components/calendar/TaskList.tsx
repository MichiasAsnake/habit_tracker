import { useState } from 'react';
import { Plus, Trash2, Copy, Check, X, Pencil } from 'lucide-react';
import { Task, TaskList as TaskListType, useCalendarStore } from '@/store/calendar-store';
import { cn } from '@/lib/utils';
import { deleteList, updateList } from '@/lib/supabase/services';

interface TaskListProps {
  list: TaskListType;
  onDuplicate?: () => void;
}

export function TaskList({ list, onDuplicate }: TaskListProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(list.title);
  const { updateTask, deleteTask, addTask } = useCalendarStore();

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      title: newTaskTitle,
      completed: false,
      listId: list.id,
    };

    addTask(list.id, newTask);
    setNewTaskTitle('');
  };

  const handleToggleTask = (taskId: string, completed: boolean) => {
    updateTask(list.id, taskId, { completed });
  };

  const handleDeleteList = async () => {
    try {
      await deleteList(list.id);
      // Update local state
      useCalendarStore.getState().deleteList(list.id);
    } catch (error) {
      console.error('Error deleting list:', error);
    }
  };

  const handleUpdateTitle = async () => {
    if (!editedTitle.trim() || editedTitle === list.title) {
      setEditedTitle(list.title);
      setIsEditingTitle(false);
      return;
    }

    try {
      await updateList(list.id, { title: editedTitle });
      // Update local state
      useCalendarStore.getState().updateList(list.id, { title: editedTitle });
      setIsEditingTitle(false);
    } catch (error) {
      console.error('Error updating list title:', error);
      setEditedTitle(list.title);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        {isEditingTitle ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="flex-1 px-2 py-1 text-lg font-semibold bg-transparent border-b-2 border-primary focus:outline-none"
              autoFocus
            />
            <button
              onClick={handleUpdateTitle}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <Check className="w-4 h-4 text-green-500" />
            </button>
            <button
              onClick={() => {
                setEditedTitle(list.title);
                setIsEditingTitle(false);
              }}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-4 h-4 text-red-500" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{list.title}</h3>
            <button
              onClick={() => setIsEditingTitle(true)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Pencil className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="flex gap-2">
          <button
            onClick={onDuplicate}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            title="Duplicate list"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={handleDeleteList}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-red-500"
            title="Delete list"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {list.tasks.map((task) => (
          <div
            key={task.id}
            className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded group"
          >
            <input
              type="checkbox"
              checked={task.completed}
              onChange={(e) => handleToggleTask(task.id, e.target.checked)}
              className="rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className={cn(
              "flex-1",
              task.completed && "line-through text-gray-400"
            )}>
              {task.title}
            </span>
            <button
              onClick={() => deleteTask(list.id, task.id)}
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <form onSubmit={handleAddTask} className="mt-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Add a new task..."
            className="flex-1 rounded-md border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="submit"
            className="p-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
} 