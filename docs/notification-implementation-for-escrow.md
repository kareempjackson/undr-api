# Notification Implementation for Escrow Service

This document outlines how notifications have been integrated into the Escrow service to provide real-time updates to users about escrow-related events.

## Overview

The Escrow service now includes notification capabilities for major events in the escrow lifecycle. These notifications are sent to both buyers and sellers at appropriate times to keep them informed about the status of their escrow agreements.

## Key Notification Events

The following events in the escrow lifecycle now trigger notifications:

### 1. Escrow Creation

When a new escrow is created:

- The buyer receives a notification confirming they've created a new escrow agreement
- The seller receives a notification that a new escrow agreement has been initiated with them

### 2. Escrow Funding

When an escrow is funded:

- The buyer receives a confirmation that they've successfully funded the escrow
- The seller receives a notification that the escrow has been funded and they can begin work

### 3. Delivery Proof Submission

When a seller submits proof of delivery:

- The buyer receives a notification about the new proof submission with a link to review it

### 4. Delivery Proof Review

When a buyer reviews a delivery proof:

- If approved: The seller receives a notification that their proof was accepted
- If rejected: The seller receives a notification that their proof was rejected, including the reason if provided

### 5. Milestone Updates

When a milestone status is updated:

- The user who updated the milestone receives a confirmation notification
- The other party receives a notification about the milestone update
- Different messages are sent for completed vs. disputed milestones

### 6. Escrow Completion

When an escrow is completed and funds are released:

- The seller receives a notification that the escrow is complete and funds have been released to their wallet
- The buyer receives a notification that the escrow is complete and funds have been released to the seller

### 7. Automatic Scheduled Releases

When an escrow is automatically released based on the scheduled release date:

- The seller receives a notification that funds have been automatically released to their wallet
- The buyer receives a notification that funds have been automatically released to the seller

### 8. Escrow Cancellation

When an escrow is cancelled:

- The user who cancelled the escrow receives a confirmation notification
- The other party receives a notification that the escrow was cancelled and by whom

## Implementation Details

### Integration with NotificationService

The EscrowService now uses the NotificationService to create notifications. Each notification includes:

- User ID: The recipient of the notification
- Type: The specific notification type (from NotificationType enum)
- Title: A concise summary of the event
- Message: A more detailed description of what happened
- Action URL: A direct link to the relevant escrow or proof
- Metadata: Additional structured data about the event

### Error Handling

All notification methods include error handling to ensure that if a notification fails to send, it doesn't affect the core escrow operations. Errors are logged for debugging but don't block the main business process.

### Example Notification Method

```typescript
/**
 * Send notifications to buyer and seller when an escrow is created
 */
private async sendEscrowCreatedNotifications(
  escrow: Escrow,
  buyer: User,
  seller: User
): Promise<void> {
  try {
    // Notification for buyer
    await this.notificationService.createNotification({
      userId: buyer.id,
      type: NotificationType.ESCROW_CREATED,
      title: "New Escrow Created",
      message: `You've created a new escrow agreement: "${escrow.title}" with ${seller.name || seller.email}`,
      actionUrl: `/escrows/${escrow.id}`,
      metadata: {
        escrowId: escrow.id,
        amount: escrow.totalAmount,
        otherParty: {
          id: seller.id,
          name: seller.name,
        },
      },
    });

    // Notification for seller
    await this.notificationService.createNotification({
      userId: seller.id,
      type: NotificationType.ESCROW_CREATED,
      title: "New Escrow Agreement",
      message: `${buyer.name || buyer.email} has created a new escrow agreement with you: "${escrow.title}"`,
      actionUrl: `/escrows/${escrow.id}`,
      metadata: {
        escrowId: escrow.id,
        amount: escrow.totalAmount,
        otherParty: {
          id: buyer.id,
          name: buyer.name,
        },
      },
    });
  } catch (error) {
    // Log error but don't block the escrow creation
    this.logger.error(
      `Error sending escrow creation notifications: ${error.message}`,
      error.stack
    );
  }
}
```

## Notification Types Used

The Escrow service uses the following notification types from the `NotificationType` enum:

- `ESCROW_CREATED`: When a new escrow agreement is created
- `ESCROW_FUNDED`: When an escrow is funded
- `ESCROW_COMPLETED`: When an escrow is completed
- `ESCROW_RELEASED`: When funds are released (including cancellations)
- `MILESTONE_UPDATED`: When a milestone status changes
- `PROOF_SUBMITTED`: When delivery proof is submitted
- `PROOF_APPROVED`: When delivery proof is approved
- `PROOF_REJECTED`: When delivery proof is rejected

## Multi-Channel Delivery

The NotificationService handles the delivery of these notifications across multiple channels based on user preferences:

1. **In-App Notifications**: All notifications are stored in the database and displayed in the user's notification center
2. **Email Notifications**: Critical notifications are also sent via email based on user preferences

## Front-End Integration

The front-end application can:

1. Fetch notifications from the `/notifications` endpoint
2. Mark notifications as read
3. Navigate to the relevant page using the `actionUrl` provided in each notification

## Testing

Unit and integration tests have been added to ensure notifications are properly triggered for each escrow event.

## Future Enhancements

Planned enhancements include:

1. Real-time push notifications using WebSockets
2. SMS notifications for critical events
3. Enhanced notification preferences to allow more granular control
4. Batch processing for high-volume notification scenarios
