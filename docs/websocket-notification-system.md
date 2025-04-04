# WebSocket Real-Time Notification System

This document outlines the implementation of the real-time notification system using WebSockets in the GhostPay application.

## Overview

The real-time notification system allows for instant delivery of notifications to users without requiring page refreshes or polling. This enhances the user experience by providing immediate feedback about important events such as escrow updates, payments, and system announcements.

## Architecture

The system uses a multi-layered approach to deliver notifications:

1. **Notification Service Layer**: Creates and stores notifications in the database
2. **WebSocket Gateway Layer**: Broadcasts notifications to connected clients in real-time
3. **Server-Sent Events (SSE) Endpoint**: Alternative for clients that cannot use WebSockets

This implementation follows the publish-subscribe pattern, where the notification service acts as the publisher, and connected clients are subscribers.

## WebSocket Gateway

The `NotificationGateway` class is the core component that handles WebSocket connections, authentication, and message distribution. It implements the following interfaces:

- `OnGatewayInit`: Initialization logic
- `OnGatewayConnection`: Handling new client connections
- `OnGatewayDisconnect`: Handling client disconnections

### Key Features

- **Namespace Isolation**: Uses the `/notifications` namespace to isolate notification traffic
- **JWT Authentication**: Secures connections using the same JWT tokens as the REST API
- **Room-Based Distribution**: Creates a private room for each user (`user:{userId}`)
- **Connected Client Tracking**: Maintains a registry of connected clients
- **Unread Count Synchronization**: Keeps unread notification counts in sync across devices

## Notification Service Integration

The `NotificationService` has been enhanced to integrate with the WebSocket gateway:

- When a notification is created, it's both stored in the database and broadcast via WebSockets
- When notifications are marked as read, the unread count is updated in real-time
- Bulk notification operations trigger appropriate WebSocket events

## Authentication

WebSocket connections are secured using JWT authentication:

1. Clients must provide a valid JWT token either in the Authorization header or as a query parameter
2. The server verifies the token using the same mechanism as the REST API
3. If the token is invalid or missing, the connection is refused
4. Upon successful authentication, the client joins a user-specific room

## Message Types

The system supports the following message types:

| Event Type                | Direction       | Description                       |
| ------------------------- | --------------- | --------------------------------- |
| `notification`            | Server → Client | New notification                  |
| `unread_count`            | Server → Client | Updated unread notification count |
| `subscribe_notifications` | Client → Server | Subscribe to notifications        |
| `ping`                    | Server → Client | Keep-alive message                |

## Client Implementation Guidelines

### WebSocket Connection

```javascript
// Connect to the notification WebSocket
const socket = io("https://api.ghostpay.com/notifications", {
  extraHeaders: {
    Authorization: `Bearer ${jwtToken}`,
  },
});

// Alternative: Use query parameter for token
// const socket = io('https://api.ghostpay.com/notifications?token=YOUR_JWT_TOKEN');

// Handle connection events
socket.on("connect", () => {
  console.log("Connected to notification system");
  // Subscribe to notifications
  socket.emit("subscribe_notifications", {}, (response) => {
    if (response.success) {
      console.log("Successfully subscribed to notifications");
    }
  });
});

// Handle disconnection
socket.on("disconnect", () => {
  console.log("Disconnected from notification system");
});
```

### Receiving Notifications

```javascript
// Listen for new notifications
socket.on("notification", (notification) => {
  console.log("New notification received:", notification);
  // Update UI or show notification to user
  if (notification.isNew) {
    showNotificationAlert(notification);
  }
});

// Listen for unread count updates
socket.on("unread_count", (data) => {
  console.log("Unread count updated:", data.count);
  // Update badge or counter in UI
  updateNotificationBadge(data.count);
});

// Handle ping messages to keep connection alive
socket.on("ping", () => {
  console.log("Ping received from server");
});
```

### Server-Sent Events Alternative

For clients that cannot use WebSockets, the system provides a Server-Sent Events (SSE) endpoint:

```javascript
// Create SSE connection
const eventSource = new EventSource(
  "https://api.ghostpay.com/notifications/events",
  {
    headers: {
      Authorization: `Bearer ${jwtToken}`,
    },
  }
);

// Handle incoming events
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "notification") {
    console.log("New notification:", data.data);
    showNotificationAlert(data.data);
  } else if (data.type === "unread_count") {
    console.log("Unread count:", data.data.count);
    updateNotificationBadge(data.data.count);
  }
};

// Handle connection errors
eventSource.onerror = (error) => {
  console.error("SSE connection error:", error);
  eventSource.close();
};
```

## Error Handling and Resilience

The system implements several resilience features:

1. **Automatic Reconnection**: The Socket.IO client automatically attempts to reconnect
2. **Circular Dependency Management**: Optional dependency injection to avoid circular dependencies
3. **Connection Tracking**: Maintains a registry of connected clients for debugging
4. **Comprehensive Error Logging**: All errors are logged for debugging and monitoring
5. **Graceful Degradation**: Falls back to REST API if WebSockets are unavailable

## Performance Considerations

- WebSocket connections are stateful and consume server resources
- The system is designed to handle thousands of concurrent connections
- For high-scale deployments, consider implementing a Redis adapter for Socket.IO
- Long polling fallback is available for clients behind restrictive firewalls

## Security Considerations

- All WebSocket connections are authenticated using JWT
- Messages are sent only to authorized users
- Notification data is sanitized before transmission
- Room names include user IDs for isolation
- Rate limiting should be implemented for production deployments

## Testing WebSockets

You can test WebSocket connections using tools like:

- Socket.IO client libraries
- `wscat` command-line tool
- Postman (with WebSocket support)
- Browser Developer Tools (Network tab, WS filter)

## Deployment Considerations

When deploying the WebSocket notification system:

1. Ensure your load balancer supports WebSocket connections
2. Configure appropriate timeouts for idle connections
3. Consider implementing sticky sessions for load-balanced environments
4. Monitor WebSocket connection counts and resource usage
