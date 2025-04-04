# Dispute Resolution System

## Overview

The Dispute Resolution System provides a comprehensive mechanism for resolving conflicts between buyers and sellers in escrow transactions. When issues arise during a transaction, either party can initiate a dispute, submit evidence, communicate through a structured messaging system, and work towards a resolution.

## Key Features

- **Dispute Creation**: Either buyer or seller can initiate a dispute for an active escrow
- **Evidence Submission**: Both parties can submit multiple types of evidence with time limits
- **Messaging System**: Built-in communication channel for discussing the dispute
- **Resolution Options**: Multiple resolution paths including mutual agreement or admin intervention
- **Admin Management**: Administrative tools for reviewing and resolving disputes

## System Architecture

The Dispute Resolution System consists of several components:

1. **Entities**:

   - `Dispute`: Core entity representing a dispute between buyer and seller
   - `DisputeEvidence`: Evidence submissions from either party
   - `DisputeMessage`: Communication and system notifications

2. **Service Layer**:

   - `DisputeService`: Core business logic for dispute management
   - `DisputeSchedulerService`: Handles time-based operations

3. **API Endpoints**:
   - RESTful endpoints for all dispute operations
   - Secured with JWT authentication

## Getting Started

### Prerequisites

- Node.js 14+
- PostgreSQL 12+
- Access to the application codebase

### Setup

1. Ensure database migrations are applied:

   ```bash
   npm run migration:run
   ```

2. The Dispute Module is automatically included in the application through the AppModule.

## Usage

### Creating a Dispute

```javascript
// Example: Creating a dispute
const dispute = await disputeService.createDispute({
  escrowId: "escrow-uuid",
  createdById: "user-uuid",
  reason: "Product not as described",
  details: { additionalInfo: "The product color is different" },
});
```

### Submitting Evidence

```javascript
// Example: Submitting evidence
const evidence = await disputeService.submitEvidence({
  disputeId: "dispute-uuid",
  submittedById: "user-uuid",
  type: EvidenceType.TEXT,
  description: "Description of the issue",
  files: [], // Optional file references
});
```

### Proposing a Resolution

```javascript
// Example: Proposing a resolution
const result = await disputeService.proposeResolution({
  disputeId: "dispute-uuid",
  proposedById: "user-uuid",
  resolution: DisputeResolution.SPLIT,
  buyerAmount: 50,
  sellerAmount: 50,
  details: { reason: "Compromise solution" },
});
```

## Configuration

### Evidence Deadline

The default evidence submission period is 5 days. This can be modified in the DisputeService:

```javascript
// In createDispute method of DisputeService
const evidenceDeadline = new Date();
evidenceDeadline.setDate(evidenceDeadline.getDate() + 5); // Change to desired number of days
```

### Scheduler Settings

The automated tasks run on specific schedules defined in DisputeSchedulerService:

```javascript
// In DisputeSchedulerService
@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT) // Change to desired schedule
async handleExpiredEvidenceDeadlines() {
  // Implementation
}
```

## Development

### Adding New Evidence Types

To add new evidence types, update the EvidenceType enum in `dispute-evidence.entity.ts`:

```typescript
export enum EvidenceType {
  TEXT = "TEXT",
  IMAGE = "IMAGE",
  DOCUMENT = "DOCUMENT",
  VIDEO = "VIDEO",
  OTHER = "OTHER",
  // Add new types here
  AUDIO = "AUDIO",
}
```

### Extending Resolution Types

To add new resolution options, update the DisputeResolution enum in `dispute.entity.ts`:

```typescript
export enum DisputeResolution {
  BUYER_REFUND = "BUYER_REFUND",
  SELLER_RECEIVE = "SELLER_RECEIVE",
  SPLIT = "SPLIT",
  CUSTOM = "CUSTOM",
  // Add new types here
  PARTIAL_REFUND = "PARTIAL_REFUND",
}
```

## Testing

Run the dispute system tests with:

```bash
npm test src/modules/dispute/dispute.e2e.spec.ts
```

## Additional Documentation

For more detailed information, see:

- [Dispute System Design](./dispute-system-design.md)
- [Escrow API Reference](./escrow-api-reference.md) (includes Dispute API endpoints)

## Future Enhancements

Planned enhancements for future releases:

- Email notification system for dispute events
- Advanced dispute analytics and reporting
- Automated resolution recommendations
- Integration with third-party arbitration services
