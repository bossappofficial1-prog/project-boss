# Socket.IO Client Usage Examples

## Installation

```bash
npm install socket.io-client
```

## Basic Connection

```javascript
import { io } from "socket.io-client";

// Koneksi ke server Socket.IO dengan authentication
const socket = io("http://localhost:6789", {
  auth: {
    token: "your_jwt_token_here",
  },
  // Atau gunakan query parameter
  // query: {
  //     token: 'your_jwt_token_here'
  // }
});

// Event listeners
socket.on("connect", () => {
  console.log("Connected to server:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.log("Disconnected:", reason);
});

socket.on("error", (error) => {
  console.error("Socket error:", error);
});
```

## Business Room Management

```javascript
// Join business room
socket.emit("join_business_room", "business-id-123", (success) => {
  if (success) {
    console.log("Successfully joined business room");
  } else {
    console.log("Failed to join business room");
  }
});

// Leave business room
socket.emit("leave_business_room", "business-id-123", (success) => {
  if (success) {
    console.log("Successfully left business room");
  }
});

// Listen for room events
socket.on("business_room_joined", (businessId) => {
  console.log("Joined business room:", businessId);
});

socket.on("business_room_left", (businessId) => {
  console.log("Left business room:", businessId);
});
```

## Listening to Events

```javascript
// Listen for new orders
socket.on("new_order", (orderData) => {
  console.log("New order received:", orderData);
  // Update UI, show notification, etc.
  showOrderNotification(orderData);
});

// Listen for order status updates
socket.on("order_status_update", (updateData) => {
  console.log("Order status updated:", updateData);
  // Update order status in UI
  updateOrderStatus(updateData.orderId, updateData.status);
});

// Listen for general notifications
socket.on("notification", (notification) => {
  console.log("Notification received:", notification);
  // Show notification in UI
  showNotification(notification);
});
```

## Health Check

```javascript
// Ping/Pong for health check
socket.emit("ping", (response) => {
  console.log("Server response:", response); // "pong"
});

socket.on("pong", (message) => {
  console.log("Pong received:", message);
});
```

## React Hook Example

```javascript
import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

export const useSocket = (token, businessId) => {
  const socketRef = useRef();
  const [isConnected, setIsConnected] = useState(false);
  const [newOrders, setNewOrders] = useState([]);

  useEffect(() => {
    if (!token) return;

    // Create socket connection
    socketRef.current = io("http://localhost:6789", {
      auth: { token },
    });

    const socket = socketRef.current;

    // Connection events
    socket.on("connect", () => {
      setIsConnected(true);

      // Auto-join business room if businessId provided
      if (businessId) {
        socket.emit("join_business_room", businessId);
      }
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    // Business events
    socket.on("new_order", (orderData) => {
      setNewOrders((prev) => [...prev, orderData]);
    });

    socket.on("order_status_update", (updateData) => {
      // Handle order status update
      console.log("Order status updated:", updateData);
    });

    socket.on("notification", (notification) => {
      // Handle notification
      console.log("Notification:", notification);
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    // Cleanup
    return () => {
      socket.disconnect();
    };
  }, [token, businessId]);

  // Helper functions
  const joinBusinessRoom = (businessId, callback) => {
    if (socketRef.current) {
      socketRef.current.emit("join_business_room", businessId, callback);
    }
  };

  const leaveBusinessRoom = (businessId, callback) => {
    if (socketRef.current) {
      socketRef.current.emit("leave_business_room", businessId, callback);
    }
  };

  return {
    socket: socketRef.current,
    isConnected,
    newOrders,
    joinBusinessRoom,
    leaveBusinessRoom,
  };
};
```

## Vue Composition API Example

```javascript
import { ref, onMounted, onUnmounted } from "vue";
import { io } from "socket.io-client";

export const useSocket = (token, businessId) => {
  const socket = ref(null);
  const isConnected = ref(false);
  const newOrders = ref([]);

  onMounted(() => {
    if (!token) return;

    socket.value = io("http://localhost:6789", {
      auth: { token },
    });

    socket.value.on("connect", () => {
      isConnected.value = true;
      if (businessId) {
        socket.value.emit("join_business_room", businessId);
      }
    });

    socket.value.on("disconnect", () => {
      isConnected.value = false;
    });

    socket.value.on("new_order", (orderData) => {
      newOrders.value.push(orderData);
    });

    socket.value.on("error", (error) => {
      console.error("Socket error:", error);
    });
  });

  onUnmounted(() => {
    if (socket.value) {
      socket.value.disconnect();
    }
  });

  return {
    socket,
    isConnected,
    newOrders,
  };
};
```

## Error Handling

```javascript
socket.on("connect_error", (error) => {
  console.error("Connection error:", error.message);

  if (error.message === "Authentication token required") {
    // Redirect to login
    redirectToLogin();
  } else if (error.message === "Authentication token expired") {
    // Refresh token and reconnect
    refreshTokenAndReconnect();
  }
});

socket.on("error", (error) => {
  console.error("Socket error:", error);

  if (error === "Rate limit exceeded") {
    // Show rate limit message
    showRateLimitMessage();
  } else if (error === "Unauthorized to access this business room") {
    // Handle authorization error
    handleUnauthorizedAccess();
  }
});
```

## Production Configuration

```javascript
const socketConfig = {
  auth: {
    token: getAuthToken(),
  },
  transports: ["websocket"], // Force websocket in production
  timeout: 20000,
  forceNew: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
  maxReconnectionAttempts: 5,
};

const socket = io(process.env.REACT_APP_SOCKET_URL, socketConfig);
```

## API Endpoints untuk Monitoring

```
GET /api/socket/stats - Get Socket.IO statistics
GET /api/socket/business/:businessId/sockets - Get connected sockets for business
POST /api/socket/test-emit - Test emit event (Admin only)
```
