# Public Socket.IO Documentation (No Auth Required)

## 📋 Overview

Public Socket.IO server yang tidak memerlukan authentication, digunakan untuk customer tracking, announcements publik, dan real-time updates yang bisa diakses oleh siapa saja.

## 🌐 Connection URL

```
Path: /socket.io/public/
Full URL: http://localhost:6789/socket.io/public/
```

## 🔧 Client Connection

### Basic Connection (No Auth Required)

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:6789", {
  path: "/socket.io/public",
  transports: ["websocket", "polling"],
});
```

### React Hook Example

```javascript
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export const usePublicSocket = (orderId) => {
  const socketRef = useRef();
  const [isConnected, setIsConnected] = useState(false);
  const [orderUpdates, setOrderUpdates] = useState([]);

  useEffect(() => {
    // Create public socket connection (no auth needed)
    socketRef.current = io("http://localhost:6789", {
      path: "/socket.io/public",
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      setIsConnected(true);

      // Auto-join order tracking if orderId provided
      if (orderId) {
        socket.emit("join_order_tracking", orderId);
      }

      // Join announcements
      socket.emit("join_announcements");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    // Order tracking events
    socket.on("order_created", (data) => {
      setOrderUpdates((prev) => [...prev, data]);
    });

    socket.on("order_status_update", (data) => {
      setOrderUpdates((prev) => [...prev, data]);
    });

    socket.on("order_prepared", (data) => {
      setOrderUpdates((prev) => [...prev, data]);
    });

    socket.on("order_ready", (data) => {
      setOrderUpdates((prev) => [...prev, data]);
    });

    // Announcement events
    socket.on("system_announcement", (data) => {
      console.log("System announcement:", data);
    });

    socket.on("maintenance_notice", (data) => {
      console.log("Maintenance notice:", data);
    });

    return () => {
      socket.disconnect();
    };
  }, [orderId]);

  return {
    socket: socketRef.current,
    isConnected,
    orderUpdates,
  };
};
```

## 📡 Available Events

### Client to Server Events

#### Join Order Tracking

```javascript
socket.emit("join_order_tracking", "order-123", (success) => {
  console.log("Joined order tracking:", success);
});
```

#### Leave Order Tracking

```javascript
socket.emit("leave_order_tracking", "order-123", (success) => {
  console.log("Left order tracking:", success);
});
```

#### Join Announcements

```javascript
socket.emit("join_announcements", (success) => {
  console.log("Joined announcements:", success);
});
```

#### Health Check

```javascript
socket.emit("ping", (response) => {
  console.log("Server response:", response); // "pong"
});
```

#### Get Connection Info

```javascript
socket.emit("get_info", (info) => {
  console.log("Connection info:", info);
  // { socketId, connected, rooms, serverTime }
});
```

### Server to Client Events

#### Order Events

```javascript
// Order created
socket.on("order_created", (data) => {
  console.log("New order created:", data);
  // { orderId, status, totalAmount, estimatedTime, outlet, createdAt }
});

// Order status updated
socket.on("order_status_update", (data) => {
  console.log("Order status updated:", data);
  // { orderId, status, updatedAt, estimatedTime }
});

// Order prepared
socket.on("order_prepared", (data) => {
  console.log("Order is prepared:", data);
  // { orderId, preparedAt, estimatedPickupTime }
});

// Order ready for pickup
socket.on("order_ready", (data) => {
  console.log("Order is ready:", data);
  // { orderId, readyAt, pickupCode }
});
```

#### Announcement Events

```javascript
// System announcements
socket.on("system_announcement", (data) => {
  console.log("System announcement:", data);
  // { title, message, type, timestamp }
});

// Maintenance notices
socket.on("maintenance_notice", (data) => {
  console.log("Maintenance notice:", data);
  // { title, message, startTime, endTime, affectedServices }
});
```

#### Connection Events

```javascript
// Order tracking joined
socket.on("order_tracking_joined", (orderId) => {
  console.log("Joined order tracking:", orderId);
});

// Order tracking left
socket.on("order_tracking_left", (orderId) => {
  console.log("Left order tracking:", orderId);
});

// Announcements joined
socket.on("announcements_joined", () => {
  console.log("Joined announcements room");
});

// Connection info
socket.on("connection_info", (info) => {
  console.log("Connection info:", info);
});

// Health check response
socket.on("pong", (message) => {
  console.log("Pong received:", message);
});
```

#### Error Events

```javascript
socket.on("error", (error) => {
  console.error("Socket error:", error);
});

socket.on("connect_error", (error) => {
  console.error("Connection error:", error);

  if (error.message.includes("Too many connections")) {
    console.log("Rate limit reached. Try again later.");
  }
});
```

## 🛡️ Security & Rate Limiting

### Connection Limits

- **Max connections per IP**: 10 connections
- **Window**: 1 minute
- **Automatic cleanup**: Every 5 minutes

### CORS Configuration

```typescript
// Development
origin: [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "*",
];

// Production
origin: [your_client_urls]; // From environment
```

## 📊 API Endpoints untuk Monitoring

### Health Check (Public)

```
GET /api/socket-public/health
```

Response:

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2025-08-25T10:30:00.000Z",
    "uptime": 3600,
    "connections": 25,
    "rooms": 10
  }
}
```

### Statistics (Auth Required - Admin/Owner)

```
GET /api/socket-public/stats
Authorization: Bearer <jwt_token>
```

### Emit Order Tracking (Auth Required - Admin/Owner)

```
POST /api/socket-public/emit-order-tracking
Authorization: Bearer <jwt_token>

Body:
{
    "orderId": "order-123",
    "event": "order_status_update",
    "data": {
        "status": "PROCESSING",
        "estimatedTime": "15 minutes"
    }
}
```

### Emit Announcement (Auth Required - Admin Only)

```
POST /api/socket-public/emit-announcement
Authorization: Bearer <jwt_token>

Body:
{
    "event": "system_announcement",
    "title": "System Maintenance",
    "message": "Scheduled maintenance from 2-4 AM",
    "data": {
        "type": "maintenance",
        "severity": "info"
    }
}
```

## 🧪 Testing

### Install Dependencies

```bash
npm install socket.io-client
```

### Run Public Socket Test

```bash
npm run socket:test-public
# or
node test-socket-public.js [server_url] [order_id]
```

### Test Output Example

```
🌐 Public Socket.IO Test Script (No Auth)
==========================================
Server: http://localhost:6789
Order ID: test-order-123
==========================================

✅ Connected to public socket server
Socket ID: abc123

🧪 Starting public socket tests...

ℹ️ Testing get connection info...
   Info received: {
     "socketId": "abc123",
     "connected": true,
     "rooms": ["abc123"],
     "serverTime": "2025-08-25T10:30:00.000Z"
   }

🏓 Testing ping/pong...
   Response: pong

📦 Testing join order tracking: test-order-123...
   Success: true
📦 Joined order tracking: test-order-123

📢 Testing join announcements...
   Success: true
📢 Joined announcements room

📦 Testing leave order tracking: test-order-123...
   Success: true
📦 Left order tracking: test-order-123

✅ All public socket tests completed

💡 Connection will stay alive for manual testing...
```

## 🎯 Use Cases

### 1. Customer Order Tracking

```javascript
// Customer joins tracking untuk order mereka
const socket = io("http://localhost:6789", {
  path: "/socket.io/public",
});

socket.emit("join_order_tracking", "ORDER-123");

socket.on("order_status_update", (data) => {
  updateOrderStatus(data.status);
  showEstimatedTime(data.estimatedTime);
});

socket.on("order_ready", (data) => {
  showPickupNotification(data.pickupCode);
});
```

### 2. Public Announcements

```javascript
// Join announcements room
socket.emit("join_announcements");

socket.on("system_announcement", (data) => {
  showNotification(data.title, data.message);
});

socket.on("maintenance_notice", (data) => {
  showMaintenanceNotice(data);
});
```

### 3. Real-time Updates dari Admin

```javascript
// Admin emit order tracking update
fetch("/api/socket-public/emit-order-tracking", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${adminToken}`,
  },
  body: JSON.stringify({
    orderId: "ORDER-123",
    event: "order_prepared",
    data: {
      preparedAt: new Date(),
      estimatedPickupTime: "5 minutes",
    },
  }),
});
```

## 💡 Best Practices

### Connection Management

```javascript
// Proper connection lifecycle
const socket = io(SERVER_URL, { path: "/socket.io/public" });

// Always handle errors
socket.on("connect_error", handleConnectionError);
socket.on("error", handleSocketError);

// Cleanup on unmount
useEffect(() => {
  return () => socket.disconnect();
}, []);
```

### Order Tracking

```javascript
// Join tracking only when needed
useEffect(() => {
  if (orderId && isTrackingActive) {
    socket.emit("join_order_tracking", orderId);

    return () => {
      socket.emit("leave_order_tracking", orderId);
    };
  }
}, [orderId, isTrackingActive]);
```

### Error Handling

```javascript
socket.on("connect_error", (error) => {
  if (error.message.includes("Too many connections")) {
    showRateLimitMessage();
    // Implement exponential backoff
    setTimeout(() => socket.connect(), 5000);
  }
});
```

## 🔗 Integration dengan Authenticated Socket

Backend Anda sekarang memiliki **DUA Socket.IO servers**:

1. **Authenticated Socket** (`/socket.io/`) - Untuk business owners, employees
2. **Public Socket** (`/socket.io/public/`) - Untuk customers, public tracking

Keduanya bisa berjalan bersamaan dan saling melengkapi!

---

**Status**: ✅ **Production Ready**  
**Last Updated**: August 25, 2025  
**Version**: 1.0.0
