# WebSocket Notifications Integration Guide

This guide provides detailed instructions for integrating real-time notifications using WebSockets in both backend and frontend applications.

## Overview

The GhostPay notification system enables real-time communication between the server and clients using WebSockets. This allows for instant delivery of notifications to users without requiring page refreshes or polling.

## Backend Integration

### Prerequisites

- NestJS application
- @nestjs/websockets and @nestjs/platform-socket.io packages
- socket.io package

### Step 1: Install Dependencies

```bash
npm install --save @nestjs/websockets @nestjs/platform-socket.io socket.io
```

### Step 2: Configure WebSockets in main.ts

```typescript
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { IoAdapter } from "@nestjs/platform-socket.io";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure WebSockets
  app.useWebSocketAdapter(new IoAdapter(app));

  // ... other configurations ...

  await app.listen(3001);
}
bootstrap();
```

### Step 3: Create WebSocket Gateway

Create a gateway file in your notification module:

```typescript
// notification.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

@WebSocketGateway({
  namespace: "notifications",
  cors: {
    origin: "*", // Configure properly for production
  },
})
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private connectedClients = new Map();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  // Implement connection handling with JWT auth
  async handleConnection(client: Socket) {
    // Extract & verify token
    // Assign user to a room
  }

  // Implement other gateway methods
}
```

### Step 4: Integrate with Notification Service

Update your notification service to send real-time updates:

```typescript
// notification.service.ts
@Injectable()
export class NotificationService {
  constructor(
    // ... existing dependencies ...
    private notificationGateway: NotificationGateway
  ) {}

  async createNotification(data: CreateNotificationDto): Promise<Notification> {
    // Create notification in database
    const notification = await this.repository.save(/* ... */);

    // Send real-time notification
    this.notificationGateway.sendNotificationToUser(
      notification.userId,
      notification
    );

    return notification;
  }

  // Update other methods to use WebSockets where appropriate
}
```

### Step 5: Add Server-Sent Events (SSE) Alternative

For clients that cannot use WebSockets:

```typescript
// notification.controller.ts
@Controller("notifications")
export class NotificationController {
  @Get("events")
  async getNotificationEvents(@Request() req, @Res() res: Response) {
    const userId = req.user.userId;

    // Configure SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    // Send initial data
    const unreadCount = await this.notificationService.getUnreadCount(userId);
    res.write(
      `data: ${JSON.stringify({
        type: "unread_count",
        data: { count: unreadCount },
      })}\n\n`
    );

    // Handle cleanup
  }
}
```

## Frontend Integration

### Prerequisites

- Socket.IO client library
- JavaScript or TypeScript frontend application

### Step 1: Install Socket.IO Client

```bash
npm install socket.io-client
```

### Step 2: Connect to WebSocket Server

```typescript
// notificationService.ts
import { io, Socket } from "socket.io-client";

export class NotificationService {
  private socket: Socket | null = null;
  private connected = false;

  constructor(private apiUrl: string, private authService: AuthService) {}

  connect() {
    const token = this.authService.getToken();
    if (!token) return;

    this.socket = io(`${this.apiUrl}/notifications`, {
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
      transports: ["websocket"],
    });

    this.socket.on("connect", this.handleConnect.bind(this));
    this.socket.on("disconnect", this.handleDisconnect.bind(this));
    this.socket.on("notification", this.handleNotification.bind(this));
    this.socket.on("unread_count", this.handleUnreadCount.bind(this));
  }

  private handleConnect() {
    this.connected = true;
    console.log("Connected to notification system");

    // Subscribe to notifications
    this.socket?.emit("subscribe_notifications", {}, (response) => {
      if (response.success) {
        console.log("Successfully subscribed to notifications");
      }
    });
  }

  // Implement other handlers
}
```

### Step 3: React Integration Example

```tsx
// NotificationProvider.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { NotificationService } from "./notificationService";

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationService = new NotificationService(API_URL, authService);

  useEffect(() => {
    // Connect to WebSocket server when component mounts
    notificationService.connect();

    // Set up event listeners
    notificationService.onNotification((notification) => {
      setNotifications((prev) => [notification, ...prev]);
      if (notification.isNew) {
        showToast(`New notification: ${notification.title}`);
      }
    });

    notificationService.onUnreadCountChange((count) => {
      setUnreadCount(count);
    });

    // Clean up on unmount
    return () => notificationService.disconnect();
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
```

### Step 4: Vue Integration Example

```javascript
// notificationPlugin.js
import { NotificationService } from "./notificationService";

export default {
  install(app, options) {
    const notificationService = new NotificationService(
      options.apiUrl,
      options.authService
    );

    app.provide("notificationService", notificationService);

    // Create reactive state
    const state = Vue.reactive({
      notifications: [],
      unreadCount: 0,
    });

    app.provide("notificationState", state);

    // Connect when app is mounted
    app.onMounted(() => {
      notificationService.connect();

      notificationService.onNotification((notification) => {
        state.notifications.unshift(notification);
      });

      notificationService.onUnreadCountChange((count) => {
        state.unreadCount = count;
      });
    });

    // Disconnect when app is unmounted
    app.onUnmounted(() => {
      notificationService.disconnect();
    });
  },
};
```

### Step 5: Angular Integration Example

```typescript
// notification.service.ts
import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { io, Socket } from "socket.io-client";
import { AuthService } from "./auth.service";

@Injectable({
  providedIn: "root",
})
export class NotificationService {
  private socket: Socket | null = null;
  private notificationsSubject = new BehaviorSubject<any[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);

  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(private authService: AuthService) {}

  connect() {
    const token = this.authService.getToken();
    if (!token) return;

    this.socket = io("/notifications", {
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    this.socket.on("notification", (event) => {
      const currentNotifications = this.notificationsSubject.value;
      this.notificationsSubject.next([event.data, ...currentNotifications]);
    });

    this.socket.on("unread_count", (event) => {
      this.unreadCountSubject.next(event.data.count);
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}
```

### Step 6: Server-Sent Events (SSE) Alternative for Frontend

For browsers or environments where WebSockets aren't available:

```typescript
// sseNotificationService.ts
export class SSENotificationService {
  private eventSource: EventSource | null = null;

  constructor(private apiUrl: string, private authService: AuthService) {}

  connect() {
    const token = this.authService.getToken();
    if (!token) return;

    this.eventSource = new EventSource(`${this.apiUrl}/notifications/events`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    this.eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleEvent(data);
    };

    this.eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      this.disconnect();
    };
  }

  private handleEvent(data) {
    // Handle different event types (notification, unread_count)
  }

  disconnect() {
    this.eventSource?.close();
    this.eventSource = null;
  }
}
```

## Testing WebSocket Integration

### Backend Testing

Use Jest and supertest for testing:

```typescript
import { Test } from "@nestjs/testing";
import * as io from "socket.io-client";
import { NotificationService } from "./notification.service";

describe("Notification WebSockets", () => {
  let app;
  let socket;
  let notificationService;

  beforeAll(async () => {
    // Set up test module and app
    // Create test JWT token

    // Connect to WebSocket server
    socket = io.connect("http://localhost:3001/notifications", {
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  });

  afterAll(() => {
    socket.disconnect();
    app.close();
  });

  it("should receive notification when created", (done) => {
    socket.on("notification", (event) => {
      expect(event.data.title).toBe("Test Notification");
      done();
    });

    // Create notification
    notificationService.createNotification({
      userId: testUser.id,
      title: "Test Notification",
      message: "Test message",
    });
  });

  // Additional test cases...
});
```

### Frontend Testing

For React with Jest and Testing Library:

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import { NotificationProvider } from "./NotificationProvider";
import { mockSocket } from "./__mocks__/socket.io-client";

// Mock socket.io-client
jest.mock("socket.io-client", () => ({
  io: () => mockSocket,
}));

describe("NotificationProvider", () => {
  test("updates unread count when receiving unread_count event", async () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );

    // Emit mock events
    mockSocket.emit("unread_count", { data: { count: 5 } });

    await waitFor(() => {
      expect(screen.getByTestId("unread-count")).toHaveTextContent("5");
    });
  });

  // Additional test cases...
});
```

## Troubleshooting

### Connection Issues

1. **CORS Errors**: Ensure your WebSocket server CORS settings match your client origin
2. **Authentication Failures**: Check JWT token validity and formatting
3. **Firewall Blocking**: Some corporate networks block WebSocket connections

### Performance Considerations

1. **Memory Usage**: Each connection consumes server memory
2. **Reconnection Strategy**: Implement exponential backoff for reconnections
3. **Message Size**: Keep payloads small for better performance

## Security Best Practices

1. **Always Authenticate Connections**: Never allow unauthenticated WebSocket connections
2. **Validate Room Names**: Prevent users from joining rooms they shouldn't have access to
3. **Sanitize Event Data**: Never send sensitive information through WebSockets
4. **Implement Rate Limiting**: Prevent denial-of-service attacks
5. **Use TLS/SSL**: Always use secure WebSocket connections (wss://)

## Production Deployment

For high-traffic production environments:

1. **Implement Redis Adapter**: For horizontal scaling

   ```typescript
   import { RedisIoAdapter } from "./redis-io.adapter";

   app.useWebSocketAdapter(new RedisIoAdapter(app));
   ```

2. **Configure Load Balancers**: Ensure they support WebSockets
3. **Monitor Connection Count**: Track active connections and resource usage
4. **Implement Circuit Breakers**: For resilience during high load
