# Notification System Implementation

This document provides a comprehensive overview of the GhostPay Notification System implementation, including architecture, components, and integration with other modules.

## Architecture Overview

The notification system follows a modular architecture that allows for easy extension and integration. It consists of:

1. **Core Entities**: Data models for storing notifications and preferences
2. **Services**: Business logic for notification management
3. **Controllers**: API endpoints for frontend interaction
4. **Events**: Integration with system events to trigger notifications
5. **Templates**: Email templates for consistent messaging

```
┌───────────────┐       ┌───────────────┐       ┌───────────────┐
│  System Event │───┬──▶│ Notification  │──────▶│ In-App        │
│  Triggers     │   │   │ Service       │       │ Notification  │
└───────────────┘   │   └───────┬───────┘       └───────────────┘
                    │           │
                    │           │
                    │           ▼
                    │   ┌───────────────┐
                    └──▶│ Email Service │──────▶│ Email         │
                        └───────────────┘       │ Notification  │
                                                └───────────────┘
```

## Core Components

### Entities

1. **Notification Entity** (`src/entities/notification.entity.ts`)

   - Stores notification data including title, message, and read status
   - Linked to users via `userId`
   - Categorized by notification types (enum)
   - Includes metadata for additional context

2. **NotificationPreference Entity** (`src/entities/notification-preference.entity.ts`)
   - Stores user preferences for each notification type and channel
   - Controls which notifications users receive and through which channels
   - Supports in-app, email, SMS, and push notification channels

### Services

1. **NotificationService** (`src/modules/notification/notification.service.ts`)

   - Core service for creating, retrieving, and managing notifications
   - Methods for marking notifications as read/unread
   - User preference management
   - Integration with other modules

2. **EmailService** (`src/modules/notification/email.service.ts`)
   - Handles email delivery via SendGrid
   - Template management and rendering
   - Email delivery tracking

### Controller

**NotificationController** (`src/modules/notification/notification.controller.ts`)

- REST API endpoints for notification management
- Protected with JWT authentication
- Endpoints for:
  - Retrieving notifications
  - Marking notifications as read
  - Managing notification preferences

### DTOs

**Notification DTOs** (`src/modules/notification/dto/notification.dto.ts`)

- Data transfer objects for API request/response
- Input validation using class-validator
- Swagger documentation

## Database Schema

```
┌─────────────────────┐     ┌──────────────────────────┐
│ Notification        │     │ NotificationPreference   │
├─────────────────────┤     ├──────────────────────────┤
│ id (PK)             │     │ id (PK)                  │
│ userId (FK)         │     │ userId (FK)              │
│ type                │     │ type                     │
│ title               │     │ channel                  │
│ message             │     │ enabled                  │
│ actionUrl           │     │ createdAt                │
│ isRead              │     │ updatedAt                │
│ metadata            │     └──────────────────────────┘
│ createdAt           │
│ updatedAt           │
└─────────────────────┘
```

## Notification Types

The system defines several notification types to categorize different events:

```typescript
export enum NotificationType {
  // Escrow related
  ESCROW_CREATED = "escrow_created",
  ESCROW_FUNDED = "escrow_funded",
  ESCROW_COMPLETED = "escrow_completed",
  ESCROW_RELEASED = "escrow_released",

  // Proof related
  PROOF_SUBMITTED = "proof_submitted",
  PROOF_APPROVED = "proof_approved",
  PROOF_REJECTED = "proof_rejected",

  // Dispute related
  DISPUTE_CREATED = "dispute_created",
  DISPUTE_RESOLVED = "dispute_resolved",
  DISPUTE_EVIDENCE = "dispute_evidence",
  DISPUTE_MESSAGE = "dispute_message",

  // Payment related
  PAYMENT_RECEIVED = "payment_received",
  PAYMENT_SENT = "payment_sent",

  // System
  SYSTEM = "system",
  SYSTEM_ANNOUNCEMENT = "system_announcement",
  SECURITY_ALERT = "security_alert",
}
```

## Notification Channels

The system supports multiple delivery channels:

```typescript
export enum NotificationChannel {
  IN_APP = "in_app",
  EMAIL = "email",
  SMS = "sms",
  PUSH = "push",
}
```

## API Endpoints

| Method | Endpoint                     | Description                         |
| ------ | ---------------------------- | ----------------------------------- |
| GET    | /notifications               | Get user notifications with filters |
| GET    | /notifications/unread-count  | Get count of unread notifications   |
| PATCH  | /notifications/:id/read      | Mark a notification as read         |
| POST   | /notifications/mark-all-read | Mark all notifications as read      |
| DELETE | /notifications/:id           | Delete a notification               |
| GET    | /notifications/preferences   | Get user notification preferences   |
| PATCH  | /notifications/preferences   | Update notification preferences     |

## Email Templates

The system uses Handlebars templates for email notifications:

1. **Base Template**: Core layout with header, footer, and branding
2. **Notification Template**: Standard notification format

Templates are stored in `src/modules/notification/templates` directory.

## Integration with Other Modules

### User Registration/Creation

When a new user is created, default notification preferences are set up:

```typescript
// Example integration in UserService
@Injectable()
export class UserService {
  constructor(private notificationService: NotificationService) {}

  async createUser(userData: CreateUserDto): Promise<User> {
    // Create user logic...

    // Setup default notification preferences
    await this.notificationService.setupDefaultPreferences(newUser.id);

    return newUser;
  }
}
```

### Escrow Module Integration

The Escrow module triggers notifications for key events:

```typescript
// Example integration in EscrowService
@Injectable()
export class EscrowService {
  constructor(private notificationService: NotificationService) {}

  async createEscrow(data: CreateEscrowDto): Promise<Escrow> {
    // Escrow creation logic...

    // Notify seller
    await this.notificationService.createNotification({
      userId: newEscrow.sellerId,
      type: NotificationType.ESCROW_CREATED,
      title: "New Escrow Agreement",
      message: `${buyer.name} has created a new escrow agreement with you.`,
      actionUrl: `/escrow/${newEscrow.id}`,
      metadata: { escrowId: newEscrow.id },
    });

    return newEscrow;
  }
}
```

### Dispute Module Integration

The Dispute module triggers notifications for dispute events:

```typescript
// Example integration in DisputeService
@Injectable()
export class DisputeService {
  constructor(private notificationService: NotificationService) {}

  async createDispute(data: CreateDisputeDto): Promise<Dispute> {
    // Dispute creation logic...

    // Notify counterparty
    await this.notificationService.createNotification({
      userId: counterpartyId,
      type: NotificationType.DISPUTE_CREATED,
      title: "Dispute Created",
      message: `A dispute has been opened for escrow ${escrow.id}.`,
      actionUrl: `/disputes/${newDispute.id}`,
      metadata: { disputeId: newDispute.id, escrowId: escrow.id },
    });

    return newDispute;
  }
}
```

### Payment Module Integration

The Payment module triggers notifications for payment events:

```typescript
// Example integration in PaymentService
@Injectable()
export class PaymentService {
  constructor(private notificationService: NotificationService) {}

  async createPayment(data: CreatePaymentDto): Promise<Payment> {
    // Payment creation logic...

    // Notify recipient
    await this.notificationService.createNotification({
      userId: payment.recipientId,
      type: NotificationType.PAYMENT_RECEIVED,
      title: "Payment Received",
      message: `You have received a payment of $${payment.amount}.`,
      actionUrl: `/payments/received/${payment.id}`,
      metadata: { paymentId: payment.id, amount: payment.amount },
    });

    return payment;
  }
}
```

## Testing

The notification system includes both unit and end-to-end tests:

- **Unit Tests**: `src/modules/notification/notification.spec.ts`
- **E2E Tests**: `src/modules/notification/notification.e2e.spec.ts`

The tests cover:

- Notification creation and retrieval
- Marking notifications as read
- User preference management
- API endpoint functionality

## Security Considerations

1. **Authentication**: All notification endpoints are protected with JWT authentication
2. **User Access Control**: Users can only access their own notifications
3. **Input Validation**: All inputs are validated using class-validator
4. **Sensitive Data**: Email templates avoid including sensitive data

## Frontend Integration

Frontend applications can integrate with the notification system through:

1. **REST API**: For retrieving and managing notifications
2. **UI Components**: For displaying notifications and preferences

Example frontend usage:

```typescript
// Example: Fetching notifications in a frontend application
async function fetchNotifications() {
  const response = await fetch("/api/notifications", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  return data.notifications;
}

// Example: Marking a notification as read
async function markAsRead(notificationId) {
  await fetch(`/api/notifications/${notificationId}/read`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
```

## Configuration

The notification system uses environment variables for configuration:

```
# SendGrid Configuration
SENDGRID_API_KEY=your_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# App URLs
APP_URL=https://app.ghostpay.com
APP_LOGO_URL=https://app.ghostpay.com/logo.png
```

## Performance Considerations

1. **Batch Processing**: Use `createBulkNotifications` for multiple recipients
2. **Pagination**: Implement pagination for notification retrieval
3. **Background Processing**: Email sending is non-blocking
4. **Indexing**: Database indexes on frequently queried fields (userId, isRead)

## Extending the System

### Adding New Notification Types

1. Add new type to `NotificationType` enum
2. Update default preferences in `setupDefaultPreferences` method
3. Implement triggering code in relevant services

### Adding New Channels

1. Add new channel to `NotificationChannel` enum
2. Implement channel-specific service (similar to EmailService)
3. Update `processNotificationChannels` method in NotificationService

## Conclusion

The GhostPay Notification System provides a robust foundation for delivering real-time notifications to users across multiple channels. Its modular design allows for easy extension and integration with other system components.
