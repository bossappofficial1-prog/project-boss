# Socket.IO Client Setup Guide

## Overview

Implementasi Socket.IO client yang telah dibuat menggunakan best practices untuk real-time communication dalam aplikasi Next.js dengan TypeScript. Setup ini menyediakan event typing yang aman, connection management otomatis, dan hooks yang dapat digunakan kembali.

## Architecture

### 1. Core Components
- **SocketContext**: Provider utama untuk Socket.IO connection
- **Custom Hooks**: Hooks khusus untuk berbagai use cases
- **TypeScript Events**: Strongly typed event definitions
- **Environment Configuration**: Konfigurasi yang fleksibel

### 2. File Structure
```
src/
├── context/
│   └── SocketContext.tsx           # Main Socket.IO context
├── hooks/
│   └── useSocket.ts               # Custom Socket.IO hooks
├── components/
│   ├── examples/
│   │   └── OrderTrackingPage.tsx  # Order tracking example
│   ├── notifications/
│   │   └── NotificationCenter.tsx # Notification system
│   └── outlet/
│       └── OutletStatusCard.tsx   # Outlet status component
└── .env.local                     # Environment configuration
```

## Setup Instructions

### 1. Environment Configuration

Buat file `.env.local` dengan konfigurasi berikut:

```bash
# Socket.IO Configuration
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_SOCKET_PATH=/socket.io/

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_ENV=development

# Socket.IO Options
NEXT_PUBLIC_SOCKET_RECONNECTION=true
NEXT_PUBLIC_SOCKET_RECONNECTION_ATTEMPTS=5
NEXT_PUBLIC_SOCKET_RECONNECTION_DELAY=1000
NEXT_PUBLIC_SOCKET_TIMEOUT=20000
```

### 2. Provider Setup

SocketProvider sudah diintegrasikan di `app/layout.tsx`:

```tsx
import { SocketProvider } from '@/context/SocketContext';

export default function Layout({ children }) {
  return (
    <html lang="id">
      <body>
        <SocketProvider>
          <RootLayout>
            {children}
          </RootLayout>
        </SocketProvider>
      </body>
    </html>
  );
}
```

## Usage Examples

### 1. Basic Socket Connection

```tsx
import { useSocket } from '@/context/SocketContext';

function MyComponent() {
  const { isConnected, emit, on, off } = useSocket();
  
  useEffect(() => {
    if (isConnected) {
      // Listen to events
      const handler = (data) => console.log('Event received:', data);
      on('custom_event', handler);
      
      // Cleanup
      return () => off('custom_event', handler);
    }
  }, [isConnected, on, off]);
  
  const sendMessage = () => {
    emit('send_message', { message: 'Hello Server!' });
  };
  
  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <button onClick={sendMessage}>Send Message</button>
    </div>
  );
}
```

### 2. Order Tracking

```tsx
import { useOrderEvents } from '@/hooks/useSocket';

function OrderPage({ orderId }) {
  const { subscribeToOrderUpdates, trackOrder } = useOrderEvents();
  
  useEffect(() => {
    const unsubscribe = subscribeToOrderUpdates(orderId, (data) => {
      console.log('Order status:', data.status);
      // Update UI based on order status
    });
    
    // Start tracking
    trackOrder(orderId);
    
    return unsubscribe;
  }, [orderId]);
  
  return <div>Order #{orderId}</div>;
}
```

### 3. Real-time Notifications

```tsx
import { useNotifications } from '@/hooks/useSocket';

function NotificationComponent() {
  const { notifications, subscribeToNotifications } = useNotifications();
  
  useEffect(() => {
    const unsubscribe = subscribeToNotifications((notification) => {
      // Handle notification
      console.log('New notification:', notification);
    });
    
    return unsubscribe;
  }, []);
  
  return (
    <div>
      {notifications.map((notif, index) => (
        <div key={index}>{notif.title}: {notif.message}</div>
      ))}
    </div>
  );
}
```

### 4. Outlet Status Updates

```tsx
import { useOutletEvents } from '@/hooks/useSocket';

function OutletPage({ outletId }) {
  const { subscribeToOutletUpdates } = useOutletEvents();
  
  useEffect(() => {
    const unsubscribe = subscribeToOutletUpdates(outletId, (data) => {
      if (data.type === 'status_changed') {
        console.log('Outlet is now:', data.isOpen ? 'Open' : 'Closed');
      }
      if (data.type === 'busy_status') {
        console.log('Wait time:', data.estimatedWaitTime);
      }
    });
    
    return unsubscribe;
  }, [outletId]);
  
  return <div>Outlet Status</div>;
}
```

### 5. Connection Management

```tsx
import { useConnectionStatus } from '@/hooks/useSocket';

function ConnectionIndicator() {
  const { isConnected, isConnecting, error, retry } = useConnectionStatus();
  
  return (
    <div>
      <span>Status: {isConnected ? 'Connected' : 'Disconnected'}</span>
      {error && <span>Error: {error}</span>}
      {!isConnected && !isConnecting && (
        <button onClick={retry}>Reconnect</button>
      )}
    </div>
  );
}
```

## Available Hooks

### 1. useOrderEvents()
- `subscribeToOrderUpdates(orderId, callback)` - Listen to specific order updates
- `subscribeToOrderConfirmation(callback)` - Listen to order confirmations
- `subscribeToOrderReady(callback)` - Listen to order ready events
- `subscribeToOrderCancelled(callback)` - Listen to order cancellations
- `trackOrder(orderId)` - Start tracking an order

### 2. useNotifications()
- `notifications` - Array of current notifications
- `subscribeToNotifications(callback)` - Listen to new notifications
- `clearNotifications()` - Clear all notifications
- `removeNotification(index)` - Remove specific notification

### 3. useOutletEvents()
- `subscribeToOutletUpdates(outletId, callback)` - Listen to outlet status changes
- `requestOutletStatus(outletId)` - Request current outlet status

### 4. useConnectionStatus()
- `isConnected` - Connection status
- `isConnecting` - Connection attempt status
- `error` - Connection error message
- `retry()` - Retry connection
- `connectionHistory` - Array of connection events

### 5. useLocationTracking()
- `startLocationTracking(orderId)` - Start sending location updates
- `isTracking` - Current tracking status

### 6. useSocketEvent()
- `useSocketEvent(eventName, callback, deps)` - Generic event listener

### 7. useSocketRoom()
- `join()` - Join a Socket.IO room
- `leave()` - Leave a Socket.IO room
- `isInRoom` - Room membership status

## Event Types

### Order Events
```typescript
interface OrderEvents {
  order_status_updated: { orderId: string; status: string; message?: string };
  order_confirmed: { orderId: string; estimatedTime: number };
  order_ready: { orderId: string; pickupCode?: string };
  order_cancelled: { orderId: string; reason: string };
  track_order: { orderId: string };
}
```

### Notification Events
```typescript
interface NotificationEvents {
  notification: { type: string; title: string; message: string; data?: any };
}
```

### Outlet Events
```typescript
interface OutletEvents {
  outlet_status_changed: { outletId: string; isOpen: boolean; reason?: string };
  outlet_busy: { outletId: string; estimatedWaitTime: number };
  get_outlet_status: { outletId: string };
}
```

## Components

### 1. NotificationCenter
Ready-to-use notification center dengan:
- Bell icon dengan badge count
- Dropdown panel dengan list notifications
- Toast notifications
- Auto-clear functionality

### 2. OrderTrackingPage
Complete order tracking component dengan:
- Real-time status updates
- Status history timeline
- Connection status indicator

### 3. OutletStatusCard
Outlet status component dengan:
- Real-time open/closed status
- Wait time estimates
- Connection indicators

## Best Practices

### 1. Error Handling
```tsx
const { error } = useConnectionStatus();

useEffect(() => {
  if (error) {
    console.error('Socket connection error:', error);
    // Handle error (show notification, retry, etc.)
  }
}, [error]);
```

### 2. Cleanup
```tsx
useEffect(() => {
  const unsubscribe = subscribeToOrderUpdates(orderId, handleUpdate);
  
  // Always return cleanup function
  return unsubscribe;
}, [orderId]);
```

### 3. Conditional Listening
```tsx
const { isConnected } = useSocket();

useEffect(() => {
  // Only listen when connected
  if (isConnected) {
    const unsubscribe = subscribeToNotifications(handleNotification);
    return unsubscribe;
  }
}, [isConnected]);
```

### 4. Room Management
```tsx
// For features that need room-based updates
const { join, leave } = useSocketRoom(`user_${userId}`, true);

// Manual room management
useEffect(() => {
  join();
  return () => leave();
}, [userId]);
```

## Integration dengan Payment Flow

### Payment Success Page
```tsx
// Dalam payment success page
useEffect(() => {
  const unsubscribe = subscribeToOrderUpdates(orderId, (data) => {
    if (data.status === 'confirmed') {
      // Redirect ke order tracking
      router.push(`/orders/${orderId}`);
    }
  });
  
  return unsubscribe;
}, [orderId]);
```

### Checkout Page
```tsx
// Untuk real-time outlet status saat checkout
const { subscribeToOutletUpdates } = useOutletEvents();

outletIds.forEach(outletId => {
  subscribeToOutletUpdates(outletId, (data) => {
    if (!data.isOpen) {
      // Show warning bahwa outlet tutup
      showWarning(`${outletName} is currently closed`);
    }
  });
});
```

## Server-Side Events (untuk reference)

```javascript
// Example server events yang perlu diimplementasi
io.on('connection', (socket) => {
  // Order events
  socket.on('track_order', ({ orderId }) => {
    socket.join(`order_${orderId}`);
  });
  
  // Outlet events
  socket.on('get_outlet_status', ({ outletId }) => {
    socket.emit('outlet_status_changed', {
      outletId,
      isOpen: getOutletStatus(outletId),
    });
  });
  
  // Send order update
  io.to(`order_${orderId}`).emit('order_status_updated', {
    orderId,
    status: 'confirmed',
    message: 'Your order has been confirmed',
  });
});
```

## Troubleshooting

### Connection Issues
1. Check environment variables
2. Verify server is running
3. Check network connectivity
4. Look at browser console for WebSocket errors

### Event Not Received
1. Verify event names match server
2. Check if connected before subscribing
3. Ensure cleanup functions are called
4. Check server-side event emission

### Performance Issues
1. Use cleanup functions to prevent memory leaks
2. Limit notification history
3. Debounce frequent events
4. Use room-based events when possible
