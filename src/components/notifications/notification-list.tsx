"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  flightId: string | null;
}

export function NotificationList() {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!session?.user) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/notifications');
        
        if (!response.ok) {
          throw new Error('Failed to fetch notifications');
        }
        
        const data = await response.json();
        setNotifications(data.notifications);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        setError('Failed to load notifications. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [session]);

  // Mark notifications as read
  const markAsRead = async (ids: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notifications as read');
      }
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          ids.includes(notification.id) 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      toast.success(`${ids.length} notification${ids.length === 1 ? '' : 's'} marked as read.`);
    } catch (err) {
      console.error('Error marking notifications as read:', err);
      toast.error('Failed to mark notifications as read. Please try again.');
    }
  };

  // Delete notifications
  const deleteNotifications = async (ids: string[]) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete notifications');
      }
      
      // Update local state
      setNotifications(prev => 
        prev.filter(notification => !ids.includes(notification.id))
      );
      
      toast.success(`${ids.length} notification${ids.length === 1 ? '' : 's'} deleted.`);
    } catch (err) {
      console.error('Error deleting notifications:', err);
      toast.error('Failed to delete notifications. Please try again.');
    }
  };

  // Mark all as read
  const markAllAsRead = () => {
    const unreadIds = notifications
      .filter(notification => !notification.read)
      .map(notification => notification.id);
    
    if (unreadIds.length > 0) {
      markAsRead(unreadIds);
    }
  };

  // Delete all notifications
  const deleteAll = () => {
    const allIds = notifications.map(notification => notification.id);
    
    if (allIds.length > 0) {
      deleteNotifications(allIds);
    }
  };

  // Get notification badge color based on type
  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case 'STATUS_CHANGE':
        return 'bg-blue-500';
      case 'DELAY':
        return 'bg-amber-500';
      case 'GATE_CHANGE':
        return 'bg-purple-500';
      case 'DEPARTURE':
        return 'bg-green-500';
      case 'ARRIVAL':
        return 'bg-teal-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Notifications</h2>
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i} className="mb-4">
            <CardHeader>
              <Skeleton className="h-4 w-3/4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-4 w-1/4" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-800 rounded-md">
        <h2 className="text-xl font-bold">Error</h2>
        <p>{error}</p>
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={() => window.location.reload()}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="p-4 bg-amber-50 text-amber-800 rounded-md">
        <h2 className="text-xl font-bold">Authentication Required</h2>
        <p>Please sign in to view your notifications.</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-2">No Notifications</h2>
        <p className="text-gray-500">You don't have any notifications yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Notifications</h2>
        <div className="space-x-2">
          <Button variant="outline" onClick={markAllAsRead}>
            Mark All as Read
          </Button>
          <Button variant="destructive" onClick={deleteAll}>
            Delete All
          </Button>
        </div>
      </div>

      {notifications.map((notification) => (
        <Card 
          key={notification.id} 
          className={`mb-4 ${!notification.read ? 'border-l-4 border-l-blue-500' : ''}`}
        >
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-lg">{notification.title}</CardTitle>
              <Badge className={getNotificationBadgeColor(notification.type)}>
                {notification.type.replace('_', ' ')}
              </Badge>
            </div>
            <CardDescription>
              {formatDate(notification.createdAt)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>{notification.message}</p>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2 pt-0">
            {!notification.read && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => markAsRead([notification.id])}
              >
                Mark as Read
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => deleteNotifications([notification.id])}
            >
              Delete
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
} 