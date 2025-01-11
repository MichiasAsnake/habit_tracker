'use client';

import { useState, useEffect } from 'react';
import { CalendarGrid } from '@/components/calendar/CalendarGrid';
import { CreateListModal } from '@/components/calendar/CreateListModal';
import { useCalendarStore } from '@/store/calendar-store';
import { startOfMonth, endOfMonth } from 'date-fns';
import { getLists } from '@/lib/supabase/services';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedModalDate, setSelectedModalDate] = useState<Date | null>(null);
  const { user } = useAuth();

  // Fetch lists when the component mounts
  useEffect(() => {
    const fetchLists = async () => {
      if (!user) return;
      
      try {
        const currentDate = new Date();
        const lists = await getLists(
          user.id,
          startOfMonth(currentDate),
          endOfMonth(currentDate)
        );
        console.log('Fetched lists:', lists);
        
        // Replace all lists in the store
        useCalendarStore.setState({ lists: lists.map(list => ({
          ...list,
          tasks: list.tasks || [],
        }))});
      } catch (error) {
        console.error('Error fetching lists:', error);
      }
    };

    fetchLists();
  }, [user]);

  const handleCreateList = (date: Date) => {
    setSelectedModalDate(date);
    setIsCreateModalOpen(true);
  };

  return (
    <main className="min-h-screen p-4 md:p-8">
      <div className="max-w-[2000px] mx-auto h-[calc(100vh-4rem)]">
        <CalendarGrid onCreateList={handleCreateList} />
      </div>

      {selectedModalDate && (
        <CreateListModal
          date={selectedModalDate}
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setSelectedModalDate(null);
          }}
        />
      )}
    </main>
  );
}
