# Notification System Overview

The GhostPay Notification System provides a robust infrastructure for delivering real-time notifications to users across multiple channels. This document provides an overview of the system architecture, features, and integration points.

## Key Features

### Multi-Channel Notifications

The notification system supports multiple delivery channels:

- **In-App**: Real-time notifications displayed within the web/mobile application
- **Email**: SendGrid-powered email notifications with HTML templates
- **SMS**: Text message notifications (integration ready)
- **Push**: Mobile push notifications (integration ready)

### User Preferences

- Users can configure which notifications they receive on each channel
- Granular control over notification types (payments, escrow events, dispute updates, etc.)
- Default preferences automatically created for new users

### Templated Content

- Handlebars-based email templates for consistent branding
- HTML and plain text versions of emails
- Reusable components for headers, footers, and buttons

### Notification Management

- Mark notifications as read/unread
- Bulk operations for marking all notifications as read
- Filtering and pagination for notification listings
- Unread count tracking

## Technical Architecture

### Core Components

1. **NotificationService**: Core service that handles notification creation, retrieval, and management
2. **EmailService**: Handles email delivery via SendGrid with templated content
3. **NotificationController**: REST API endpoints for notification management
4. **Entities**:
   - `Notification`: Stores notification data
   - `NotificationPreference`: Stores user preferences for each notification type and channel

### Data Model

#### Notification Entity

| Field     | Type              | Description                                     |
| --------- | ----------------- | ----------------------------------------------- |
| id        | UUID              | Unique identifier                               |
| userId    | UUID              | User receiving the notification                 |
| type      | NotificationType  | Category of notification (enum)                 |
| title     | String            | Short notification title                        |
| message   | String            | Detailed notification message                   |
| actionUrl | String (optional) | URL to navigate to when notification is clicked |
| isRead    | Boolean           | Whether user has read the notification          |
| metadata  | JSON              | Additional data related to the notification     |
| createdAt | DateTime          | When the notification was created               |
| updatedAt | DateTime          | When the notification was last updated          |

#### NotificationPreference Entity

| Field     | Type                | Description                               |
| --------- | ------------------- | ----------------------------------------- |
| id        | UUID                | Unique identifier                         |
| userId    | UUID                | User owning the preference                |
| type      | NotificationType    | Category of notification (enum)           |
| channel   | NotificationChannel | Delivery channel (enum)                   |
| enabled   | Boolean             | Whether this notification type is enabled |
| createdAt | DateTime            | When the preference was created           |
| updatedAt | DateTime            | When the preference was last updated      |

### Notification Types

The system defines several notification types:

- **Escrow related**: `escrow_created`, `escrow_funded`, `escrow_completed`, `escrow_released`
- **Proof related**: `proof_submitted`, `proof_approved`, `proof_rejected`
- **Dispute related**: `dispute_created`, `dispute_resolved`, `dispute_evidence`, `dispute_message`
- **Payment related**: `payment_received`, `payment_sent`
- **System**: `system`, `system_announcement`, `security_alert`

## API Endpoints

### Notifications

- `GET /notifications`: List user's notifications with filtering and pagination
- `GET /notifications/unread-count`: Get count of unread notifications
- `PATCH /notifications/:id/read`: Mark a notification as read
- `POST /notifications/mark-all-read`: Mark all notifications as read
- `DELETE /notifications/:id`: Delete a notification

### Notification Preferences

- `GET /notifications/preferences`: Get user's notification preferences
- `PATCH /notifications/preferences`: Update user's notification preferences

## Integration with Other Modules

### Integration with Escrow System

The Notification System is integrated with the Escrow System to send notifications for:

- Escrow creation and funding
- Proof submission and status changes
- Escrow completion and fund release

### Integration with Dispute System

The Notification System notifies users about dispute events:

- New dispute creation
- Evidence submission
- Messages from counterparty
- Resolution proposals
- Final resolutions

### Integration with Payment System

The Notification System notifies users about payment events:

- Incoming payments
- Outgoing payments
- Failed transactions
- Wallet funding

## Email Templates

The system includes default email templates:

- **Base Template**: Core layout with header, footer, and branding
- **Notification Template**: Standard notification format with title, message, and optional action button

Custom templates can be added by placing `.hbs` files in the `templates` directory.

## Getting Started

### Setting Up SendGrid

1. Create a SendGrid account
2. Generate an API key
3. Add to environment variables:
   ```
   SENDGRID_API_KEY=your_api_key_here
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   ```

### Default User Preferences

When a new user is created, the system automatically generates default notification preferences. By default:

- Critical notifications are enabled on all channels
- Marketing notifications are enabled only for email
- All other notifications are enabled for in-app, but disabled for other channels

### Sending Your First Notification

```typescript
// Inject the NotificationService
constructor(private notificationService: NotificationService) {}

// Create a notification
await this.notificationService.createNotification({
  userId: "user-uuid",
  type: NotificationType.PAYMENT_RECEIVED,
  title: "Payment Received",
  message: "You received a payment of $50.00",
  actionUrl: "/payments/history",
  metadata: { amount: 50.00, transactionId: "tx123" }
});
```

## Future Enhancements

- Real-time WebSocket notifications
- Scheduled/recurring notifications
- Notification analytics and metrics
- Advanced delivery rules (time-of-day, frequency capping)
- Additional notification channels (Discord, Telegram)
