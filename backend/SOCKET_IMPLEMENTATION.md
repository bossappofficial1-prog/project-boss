# Socket.IO Implementation Documentation

## 📋 Overview

Implementasi Socket.IO yang telah ditingkatkan dengan TypeScript types, authentication/authorization, error handling yang robust, dan konfigurasi CORS yang ketat untuk production.

## 🚀 Fitur Utama

### ✅ Yang Sudah Diimplementasi:

1. **TypeScript Types** - Strongly typed events dan socket data
2. **Authentication & Authorization** - JWT-based auth dengan role-based access
3. **Error Handling** - Comprehensive error handling dan logging
4. **CORS Configuration** - Environment-based CORS settings
5. **Rate Limiting** - Protection against spam dan abuse
6. **Room Management** - Business-specific rooms untuk targeted messaging
7. **Health Check** - Ping/pong untuk connection monitoring
8. **Statistics & Monitoring** - Real-time connection stats
9. **Real-time Notifications** - Order updates dan business notifications

## 📁 File Structure

```
src/
├── config/
│   └── socket.ts                    # Socket.IO server configuration
├── types/
│   └── socket.ts                    # TypeScript types untuk events
├── middleware/
│   └── socket.middleware.ts         # Auth, rate limiting, dan validation
├── controller/
│   └── socket.controller.ts         # HTTP endpoints untuk monitoring
├── routes/
│   └── socket.routes.ts            # API routes untuk socket management
└── service/
    └── order.service.ts            # Contoh penggunaan Socket.IO
```

## 🔧 Konfigurasi

### Environment Variables

```env
# Tambahkan di .env file
CLIENT_URL=http://localhost:3000,http://localhost:3001
NODE_ENV=production
JWT_SECRET=your-secret-key
```

### CORS Settings

```typescript
// Automatic CORS based on environment
const corsOrigins = config.isProduction
  ? Array.isArray(config.CLIENT_URL)
    ? config.CLIENT_URL
    : [config.CLIENT_URL]
  : ["http://localhost:3000", "http://localhost:3001", "http://127.0.0.1:3000"];
```

## 🔐 Authentication Flow

### Client Authentication

```javascript
const socket = io("http://localhost:6789", {
  auth: { token: "your_jwt_token" },
  // Atau query: { token: 'your_jwt_token' }
  // Atau header: Authorization: Bearer your_jwt_token
});
```

### Server Validation

1. Extract token dari multiple sources (auth, query, header)
2. Verify JWT token
3. Validate user exists dan active
4. Set socket.data dengan user info
5. Auto-join business room jika applicable

## 📡 Event Types

### Client to Server Events

```typescript
interface ClientToServerEvents {
  join_business_room: (
    businessId: string,
    callback?: (success: boolean) => void
  ) => void;
  leave_business_room: (
    businessId: string,
    callback?: (success: boolean) => void
  ) => void;
  ping: (callback?: (response: string) => void) => void;
}
```

### Server to Client Events

```typescript
interface ServerToClientEvents {
  new_order: (data: NewOrderData) => void;
  order_status_update: (data: OrderStatusUpdateData) => void;
  notification: (data: NotificationData) => void;
  business_room_joined: (businessId: string) => void;
  business_room_left: (businessId: string) => void;
  pong: (message: string) => void;
  error: (message: string) => void;
}
```

## 🛡️ Security Features

### Rate Limiting

- 100 requests per minute per socket
- Automatic cleanup setiap 5 menit
- Configurable limits

### Authorization

- Role-based access control (ADMIN, OWNER)
- Business-specific room access
- JWT token validation

### Error Handling

- Graceful error handling
- Comprehensive logging
- Client error notifications

## 📊 Monitoring & Statistics

### HTTP Endpoints

```
GET /api/socket/stats
- Get connection statistics
- Requires ADMIN atau OWNER role

GET /api/socket/business/:businessId/sockets
- Get sockets connected to specific business
- Requires ADMIN atau OWNER role

POST /api/socket/test-emit
- Test emit events (Admin only)
- Requires ADMIN role
```

### Real-time Stats

```typescript
{
    connectedSockets: number,
    totalRooms: number,
    rooms: string[]
}
```

## 🔄 Usage Examples

### Emit New Order Event

```typescript
// Di service/order.service.ts
import { emitToBusinessRoom } from "../config/socket";

const success = emitToBusinessRoom(businessId, "new_order", orderData);
if (!success) {
  console.warn("Failed to emit new_order event");
}
```

### Join Business Room

```javascript
// Client-side
socket.emit("join_business_room", "business-123", (success) => {
  if (success) {
    console.log("Joined business room");
  }
});
```

### Listen for Events

```javascript
// Client-side
socket.on("new_order", (orderData) => {
  console.log("New order:", orderData);
  // Update UI
});

socket.on("error", (error) => {
  console.error("Socket error:", error);
  // Handle error
});
```

## 🚀 Production Considerations

### Server Configuration

```typescript
const io = new Server(server, {
  cors: {
    /* environment-based CORS */
  },
  transports: config.isProduction ? ["websocket"] : ["polling", "websocket"],
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 10000,
  maxHttpBufferSize: 1e6,
  allowEIO3: false, // Security
});
```

### Client Configuration

```javascript
const socket = io(SERVER_URL, {
  transports: ["websocket"],
  timeout: 20000,
  forceNew: true,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});
```

## 🐛 Debugging & Logging

### Server Logs

```
✅ User connected: user-123 (socket-456)
📡 User user-123 joined business room: business-789
📡 Emitted new_order to business room: business-789
❌ User disconnected: user-123 (socket-456). Reason: transport close
⚠️ Rate limit exceeded for socket socket-456
⚠️ Unauthorized access attempt by user-123 to business business-999
```

### Error Patterns

- `Authentication token required`
- `Authentication token expired`
- `User not found`
- `User account is not active`
- `Rate limit exceeded`
- `Unauthorized to access this business room`

## 📈 Performance Optimization

### Memory Management

- Automatic rate limiter cleanup
- Socket data cleanup on disconnect
- Room cleanup on leave

### Connection Optimization

- WebSocket-only in production
- Configurable timeouts
- Reconnection handling

## 🔮 Future Enhancements

### Planned Features

1. **Redis Adapter** - Untuk multi-server scaling
2. **Message Queuing** - Reliable message delivery
3. **Presence System** - Online/offline status
4. **File Sharing** - Document dan image sharing
5. **Voice/Video** - WebRTC integration
6. **Analytics** - Detailed usage analytics

### Scaling Considerations

```typescript
// Redis adapter untuk multi-server
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";

const pubClient = createClient({ url: "redis://localhost:6379" });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

## 📚 References

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Socket.IO Client API](https://socket.io/docs/v4/client-api/)
- [JWT Authentication](https://jwt.io/)
- [TypeScript Types](https://www.typescriptlang.org/)

---

**Status**: ✅ **Production Ready**  
**Last Updated**: August 25, 2025  
**Version**: 1.0.0
