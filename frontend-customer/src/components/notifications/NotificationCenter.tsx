'use client';

import React, { useEffect, useState } from 'react';
import { useNotifications, useConnectionStatus } from '@/hooks/useSocket';
import { Bell, X, CheckCircle, AlertCircle, Info, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface NotificationProps {
  type?: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

const NotificationItem: React.FC<NotificationProps> = ({
  type = 'info',
  title,
  message,
  onClose,
  autoClose = true,
  duration = 5000,
}) => {
  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <Card className={`${getBorderColor()} border-l-4 mb-3 animate-in slide-in-from-right`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {getIcon()}
            <div className="flex-1">
              <h4 className="font-medium text-sm">{title}</h4>
              <p className="text-sm text-gray-600 mt-1">{message}</p>
            </div>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const NotificationCenter: React.FC = () => {
  const { notifications, subscribeToNotifications, clearNotifications, removeNotification } = useNotifications();
  const { isConnected } = useConnectionStatus();
  const [isVisible, setIsVisible] = useState(false);

  // Subscribe to notifications
  useEffect(() => {
    const unsubscribe = subscribeToNotifications((notification) => {
      console.log('New notification:', notification);

      // Show notification center briefly when new notification arrives
      setIsVisible(true);
      setTimeout(() => setIsVisible(false), 3000);
    });

    return unsubscribe;
  }, [subscribeToNotifications]);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Notification Bell Button */}
      <div className="relative">
        <Button
          onClick={toggleVisibility}
          variant="outline"
          size="sm"
          className="relative bg-white shadow-lg"
        >
          <Bell className="h-4 w-4" />
          {notifications.length > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs bg-red-500">
              {notifications.length > 9 ? '9+' : notifications.length}
            </Badge>
          )}
        </Button>

        {/* Connection Status Indicator */}
        <div className="absolute -bottom-1 -right-1">
          {isConnected ? (
            <Wifi className="h-3 w-3 text-green-500" />
          ) : (
            <WifiOff className="h-3 w-3 text-red-500" />
          )}
        </div>
      </div>

      {/* Notification Panel */}
      {isVisible && (
        <div className="absolute top-12 right-0 w-80 max-h-96 overflow-y-auto bg-white rounded-lg shadow-xl border animate-in slide-in-from-top">
          <div className="p-4 border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Notifications</h3>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{notifications.length}</Badge>
                {notifications.length > 0 && (
                  <Button
                    onClick={clearNotifications}
                    variant="ghost"
                    size="sm"
                    className="text-xs"
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="p-4">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification, index) => (
                  <NotificationItem
                    key={index}
                    type={notification.type}
                    title={notification.title}
                    message={notification.message}
                    onClose={() => removeNotification(index)}
                    autoClose={false}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Toast Notification Component (for global notifications)
export const ToastNotification: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();
  const [activeToasts, setActiveToasts] = useState<Array<{
    id: number;
    notification: any;
  }>>([]);

  useEffect(() => {
    // Only show the latest notification as toast
    if (notifications.length > 0) {
      const latestNotification = notifications[0];
      const toastId = Date.now();

      setActiveToasts(prev => [
        ...prev,
        { id: toastId, notification: latestNotification }
      ]);

      // Auto remove after 5 seconds
      setTimeout(() => {
        setActiveToasts(prev => prev.filter(toast => toast.id !== toastId));
      }, 5000);
    }
  }, [notifications]);

  const removeToast = (toastId: number) => {
    setActiveToasts(prev => prev.filter(toast => toast.id !== toastId));
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {activeToasts.map((toast) => (
        <div key={toast.id} className="animate-in slide-in-from-bottom">
          <NotificationItem
            type={toast.notification.type}
            title={toast.notification.title}
            message={toast.notification.message}
            onClose={() => removeToast(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default NotificationCenter;
