import { Metadata } from 'next';
import { Suspense } from 'react';
import { NotificationList } from '@/components/notifications/notification-list';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata: Metadata = {
  title: 'Notifications | Flight Tracker',
  description: 'View and manage your flight notifications',
};

export default function NotificationsPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Your Notifications</h1>
      
      <Suspense fallback={<NotificationsLoading />}>
        <NotificationList />
      </Suspense>
    </div>
  );
}

function NotificationsLoading() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Notifications</h2>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-lg p-4 mb-4">
          <div className="flex justify-between items-start mb-2">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-4 w-1/3 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6 mb-4" />
          <div className="flex justify-end space-x-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
} 