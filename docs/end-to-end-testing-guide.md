# End-to-End Testing Guide: WebSocket Notification System

This guide provides detailed instructions for testing the WebSocket notification system, covering both manual and automated testing approaches.

## Prerequisites

Before testing, ensure you have the following:

- A running GhostPay API instance
- Access to valid user credentials or JWT tokens
- A tool for WebSocket testing (listed below)
- Basic knowledge of WebSockets and the GhostPay notification system

## Testing Tools

### CLI Tools

- **wscat**: Command-line WebSocket client

  ```bash
  # Install globally
  npm install -g wscat

  # Connect with token
  wscat -c "ws://localhost:3001/notifications" -H "Authorization: Bearer YOUR_JWT_TOKEN"
  ```

### GUI Tools

- **Postman**: Supports WebSocket connections in newer versions
- **WebSocket King**: Chrome extension for WebSocket testing
- **Simple WebSocket Client**: Another Chrome extension option

### Browser Console

```javascript
// Connect to WebSocket server
const socket = io("http://localhost:3001/notifications", {
  extraHeaders: {
    Authorization: `Bearer ${jwtToken}`,
  },
});

// Listen for events
socket.on("connect", () => console.log("Connected"));
socket.on("notification", (data) => console.log("Notification:", data));
socket.on("unread_count", (data) => console.log("Unread count:", data));

// Subscribe to notifications
socket.emit("subscribe_notifications", {}, (response) => {
  console.log("Subscription response:", response);
});
```

## Manual Testing Checklist

### Connection Testing

1. **Authentication**

   - [ ] Connect with valid token (should succeed)
   - [ ] Connect without token (should fail)
   - [ ] Connect with expired token (should fail)
   - [ ] Connect with malformed token (should fail)

2. **Reconnection**
   - [ ] Disconnect and reconnect manually
   - [ ] Verify the client receives notifications after reconnection
   - [ ] Test automatic reconnection by temporarily stopping the server

### Notification Delivery

1. **Creating Notifications**

   - [ ] Create a notification via API for the authenticated user
   - [ ] Verify it is received in real-time via WebSocket
   - [ ] Check that the notification contains correct data

2. **Bulk Notifications**

   - [ ] Create notifications for multiple users
   - [ ] Verify each user receives only their notifications

3. **Notification Management**
   - [ ] Mark a notification as read via API
   - [ ] Verify unread count is updated in real-time
   - [ ] Mark all notifications as read
   - [ ] Verify unread count is set to zero

### Testing Multiple Sessions

1. **Multiple Connections**

   - [ ] Connect from multiple browsers/tabs with the same user
   - [ ] Verify all connections receive notifications
   - [ ] Test that all connections receive unread count updates

2. **Different Devices**
   - [ ] Connect from desktop and mobile simultaneously
   - [ ] Verify notifications sync across devices

### Edge Cases

1. **Large Notifications**

   - [ ] Test with notifications containing large text content
   - [ ] Test with notifications containing complex metadata

2. **High Frequency**

   - [ ] Create multiple notifications in rapid succession
   - [ ] Verify all are delivered correctly

3. **Network Issues**
   - [ ] Test with network throttling enabled
   - [ ] Test behavior during intermittent connectivity

## Automated Testing

### Unit Tests

Run unit tests for the notification and WebSocket components:

```bash
# Run all notification tests
npm test -- src/modules/notification

# Run specific WebSocket tests
npm test -- src/modules/notification/websocket-notification.test.ts
```

### End-to-End Tests

The project includes comprehensive end-to-end tests that verify the entire notification flow from creation to real-time delivery:

```bash
# Run all E2E tests
npm run test:e2e

# Run specific notification E2E tests
npm run test:e2e -- -t "Notification System"
```

### Load Testing

For production environments, consider running load tests to verify system performance under high connection counts:

```bash
# Install Artillery for load testing
npm install -g artillery

# Run a basic load test (requires custom script)
artillery run websocket-load-test.yml
```

## Troubleshooting Common Issues

### Connection Problems

1. **CORS Errors**

   - Check browser console for CORS errors
   - Ensure CORS is properly configured in main.ts
   - Verify origins match between client and server

2. **Authentication Failures**

   - Verify token is valid and not expired
   - Check token format and presence in headers
   - Look for auth errors in server logs

3. **Connection Refused**
   - Verify server is running
   - Check port and hostname are correct
   - Ensure no firewall is blocking WebSocket connections

### Event Reception Issues

1. **Not Receiving Events**

   - Verify subscription was successful
   - Check room assignment in server logs
   - Ensure correct namespace is being used ('/notifications')

2. **Duplicate Events**
   - Check for multiple listeners on the same event
   - Verify client is not creating multiple connections

## Manual Testing Scripts

### Basic Connection Test

1. Obtain a valid JWT token
2. Connect using wscat:
   ```bash
   wscat -c "ws://localhost:3001/notifications" -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```
3. Send subscription message:
   ```json
   { "event": "subscribe_notifications", "data": {} }
   ```
4. Wait for response confirming subscription

### Full Notification Flow Test

1. Connect with valid token
2. Subscribe to notifications
3. Using a separate terminal, create a notification via API:
   ```bash
   curl -X POST \
     http://localhost:3001/admin/notifications \
     -H 'Authorization: Bearer ADMIN_TOKEN' \
     -H 'Content-Type: application/json' \
     -d '{
       "userIds": ["YOUR_USER_ID"],
       "type": "SYSTEM_ANNOUNCEMENT",
       "title": "Test Notification",
       "message": "This is a test notification",
       "actionUrl": "/test"
     }'
   ```
4. Verify the notification appears in the WebSocket connection
5. Mark the notification as read via API:
   ```bash
   curl -X PATCH \
     http://localhost:3001/notifications/NOTIFICATION_ID/read \
     -H 'Authorization: Bearer YOUR_JWT_TOKEN'
   ```
6. Verify the unread count update arrives via WebSocket

## SSE Testing

For testing the Server-Sent Events fallback:

1. Open a browser and navigate to a simple HTML page with this script:

   ```html
   <script>
     const eventSource = new EventSource(
       "http://localhost:3001/notifications/events",
       {
         headers: { Authorization: "Bearer YOUR_JWT_TOKEN" },
       }
     );

     eventSource.onmessage = (event) => {
       console.log("Event received:", JSON.parse(event.data));
     };

     eventSource.onerror = (error) => {
       console.error("SSE error:", error);
     };
   </script>
   ```

2. Check browser console for events
3. Create notifications using the API and verify they appear in the console

## Performance Verification

For production deployments, verify:

1. **Connection Scaling**

   - System can handle expected number of simultaneous connections
   - Memory usage remains stable with many connections

2. **Message Throughput**

   - System can deliver notifications to many users simultaneously
   - No significant delay in notification delivery

3. **Reconnection Handling**
   - System properly handles clients reconnecting after disconnection
   - Connection state is properly managed

## Test Reporting

Document your test results including:

1. Test environment details
2. Number of successful/failed tests
3. Performance metrics
4. Any issues discovered
5. Screenshots or logs of notable behavior

## Continuous Integration

The WebSocket notification tests are integrated into the CI pipeline:

- Unit tests run on every pull request
- E2E tests run on merges to staging/main branches
- Load tests run weekly on the staging environment

## Security Testing

Ensure you verify security aspects:

1. Authentication is properly enforced
2. Users can only access their own notifications
3. Room names are properly secured
4. WebSocket connections use TLS in production
