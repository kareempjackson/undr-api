# Dispute Resolution System Design (Phase 2)

## Overview

The Dispute Resolution System extends the GhostPay escrow functionality to handle disagreements between buyers and sellers. This system allows users to raise disputes, present evidence, and either reach a mutual resolution or receive a decision from platform moderators.

## Key Requirements

1. **Dispute Creation**

   - Allow either buyer or seller to create a dispute on an active escrow
   - Support various dispute reasons (quality issues, incomplete work, etc.)
   - Block normal escrow completion while a dispute is active

2. **Evidence Submission**

   - Enable both parties to submit evidence supporting their position
   - Support various evidence types (text, images, documents, links)
   - Provide clear timeframes for evidence submission

3. **Resolution Paths**

   - Support mutual resolution between parties
   - Implement moderation-based resolution by admins
   - Allow for partial refunds or split payments as resolution options

4. **Communication**

   - Implement a dispute-specific messaging system
   - Notify users of dispute status changes and deadlines
   - Record all communications for audit purposes

5. **Automation**
   - Implement automatic reminders for dispute actions
   - Auto-close disputes with no activity after a specified period
   - Provide escalation paths for unresolved disputes

## System Design

### 1. Data Model

#### Dispute Entity

```typescript
export enum DisputeStatus {
  OPENED = "OPENED",
  EVIDENCE_SUBMISSION = "EVIDENCE_SUBMISSION",
  UNDER_REVIEW = "UNDER_REVIEW",
  MUTUALLY_RESOLVED = "MUTUALLY_RESOLVED",
  RESOLVED_BY_ADMIN = "RESOLVED_BY_ADMIN",
  CLOSED = "CLOSED",
  EXPIRED = "EXPIRED",
}

export enum DisputeResolution {
  BUYER_FAVOR = "BUYER_FAVOR", // Full refund to buyer
  SELLER_FAVOR = "SELLER_FAVOR", // Full payment to seller
  SPLIT = "SPLIT", // Payment split between parties
  CUSTOM = "CUSTOM", // Custom resolution
}

export class Dispute {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  escrowId: string;

  @ManyToOne(() => Escrow)
  escrow: Escrow;

  @Column()
  createdById: string;

  @ManyToOne(() => User)
  createdBy: User;

  @Column({ type: "enum", enum: DisputeStatus, default: DisputeStatus.OPENED })
  status: DisputeStatus;

  @Column({ type: "text" })
  reason: string;

  @Column({ type: "jsonb", nullable: true })
  details: any;

  @Column({ nullable: true })
  reviewedById: string;

  @ManyToOne(() => User, { nullable: true })
  reviewedBy: User;

  @Column({ type: "enum", enum: DisputeResolution, nullable: true })
  resolution: DisputeResolution;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  buyerAmount: number; // Amount to refund to buyer

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: true })
  sellerAmount: number; // Amount to pay to seller

  @Column({ type: "timestamp", nullable: true })
  evidenceDeadline: Date;

  @Column({ type: "timestamp", nullable: true })
  resolvedAt: Date;

  @Column({ type: "jsonb", nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### DisputeEvidence Entity

```typescript
export enum EvidenceType {
  TEXT = "TEXT",
  IMAGE = "IMAGE",
  DOCUMENT = "DOCUMENT",
  LINK = "LINK",
  VIDEO = "VIDEO",
}

export class DisputeEvidence {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  disputeId: string;

  @ManyToOne(() => Dispute)
  dispute: Dispute;

  @Column()
  submittedById: string;

  @ManyToOne(() => User)
  submittedBy: User;

  @Column({ type: "enum", enum: EvidenceType })
  type: EvidenceType;

  @Column({ type: "text" })
  description: string;

  @Column({ type: "jsonb", nullable: true })
  files: any; // Array of file URLs or details

  @Column({ type: "jsonb", nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### DisputeMessage Entity

```typescript
export class DisputeMessage {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  disputeId: string;

  @ManyToOne(() => Dispute)
  dispute: Dispute;

  @Column()
  senderId: string;

  @ManyToOne(() => User)
  sender: User;

  @Column({ type: "text" })
  message: string;

  @Column({ type: "boolean", default: false })
  isSystemMessage: boolean;

  @Column({ type: "jsonb", nullable: true })
  metadata: any;

  @CreateDateColumn()
  createdAt: Date;
}
```

### 2. Service Layer

#### DisputeService

Core service responsible for dispute management:

- `createDispute`: Create a new dispute on an escrow
- `submitEvidence`: Add evidence to a dispute
- `sendMessage`: Add a message to the dispute conversation
- `proposeResolution`: Propose a resolution option
- `acceptResolution`: Accept a proposed resolution
- `resolveDisputeByAdmin`: Admin resolution of a dispute
- `closeDispute`: Close a dispute after resolution
- `getDisputeDetails`: Get comprehensive dispute information
- `getDisputesForUser`: Get disputes related to a user
- `getEvidenceForDispute`: Get all evidence for a dispute
- `getMessagesForDispute`: Get conversation history

#### DisputeSchedulerService

Service that handles time-based operations:

- `processDisputeDeadlines`: Check for and process expired evidence submission periods
- `sendReminderNotifications`: Send reminders about impending deadlines
- `escalateInactiveDisputes`: Escalate disputes with no activity

### 3. API Endpoints

#### Dispute Management

- `POST /security/escrows/:id/dispute`: Create a dispute on an escrow
- `GET /security/disputes`: List disputes for the authenticated user
- `GET /security/disputes/:id`: Get dispute details
- `POST /security/disputes/:id/evidence`: Submit evidence for a dispute
- `GET /security/disputes/:id/evidence`: Get all evidence for a dispute
- `POST /security/disputes/:id/message`: Send a message in the dispute
- `GET /security/disputes/:id/messages`: Get messages for a dispute
- `POST /security/disputes/:id/propose-resolution`: Propose a resolution
- `POST /security/disputes/:id/accept-resolution`: Accept a proposed resolution

#### Admin Endpoints

- `GET /admin/disputes`: List all disputes (with filtering)
- `GET /admin/disputes/:id`: Get comprehensive dispute details
- `POST /admin/disputes/:id/resolve`: Resolve a dispute as admin
- `POST /admin/disputes/:id/extend-deadline`: Extend evidence submission deadline

## Workflow

### 1. Dispute Creation

1. Buyer or seller initiates a dispute on an active escrow
2. Escrow status changes to `DISPUTED`
3. Both parties are notified
4. Evidence submission period begins (default: 5 days)

### 2. Evidence Submission

1. Both parties submit evidence supporting their position
2. System stores evidence and maintains timestamps
3. Parties can continue communication during this period
4. Either party can propose a resolution at any time

### 3. Resolution Paths

#### Mutual Resolution

1. One party proposes a resolution (e.g., partial refund)
2. Other party accepts or counter-proposes
3. Once both agree, the resolution is executed
4. Funds are distributed according to the agreement
5. Dispute is marked `MUTUALLY_RESOLVED`

#### Admin Resolution

1. If no mutual resolution by deadline, dispute status changes to `UNDER_REVIEW`
2. Admin reviews the dispute, evidence, and communication
3. Admin determines a resolution and execution path
4. Admin marks the dispute as `RESOLVED_BY_ADMIN`
5. Funds are distributed according to admin decision
6. Both parties are notified of the resolution

## Implementation Plan

### Phase 2.1: Core Dispute Functionality

- Create database entities for disputes, evidence, and messages
- Implement DisputeService with basic functionality
- Build API endpoints for dispute creation and management
- Update Escrow entity to handle disputed status
- Add dispute-related validation to existing escrow endpoints

### Phase 2.2: Evidence and Communication

- Implement evidence submission functionality
- Create secure file storage for evidence files
- Build messaging system for dispute communication
- Add notification system for dispute activities

### Phase 2.3: Resolution Mechanisms

- Implement mutual resolution workflow
- Build admin resolution interface
- Create split payment and custom resolution options
- Add transaction mechanisms for resolution execution

### Phase 2.4: Automation and Scheduling

- Implement DisputeSchedulerService
- Add deadline management and reminders
- Create automatic status transitions
- Build reporting and analytics for disputes

## Security Considerations

1. **Access Control**

   - Only escrow participants can access dispute details
   - Evidence is only visible to dispute participants and admins
   - Resolution execution requires verification

2. **Data Protection**

   - All dispute evidence and messages are encrypted
   - PII in disputes follows the same protection as other platform data
   - Evidence files are stored securely with access controls

3. **Audit Trail**
   - All actions within a dispute are logged
   - Resolution decisions include justification
   - Admin actions are tracked with admin identity

## Metrics and Monitoring

- Track dispute frequency by transaction volume
- Monitor average resolution time
- Measure percentage of disputes resolved mutually vs. by admin
- Track dispute outcomes and resolution types
- Monitor user satisfaction with dispute resolution

## Testing Strategy

- Unit tests for DisputeService and related functionality
- Integration tests for dispute workflows
- E2E tests for complete dispute scenarios
- Performance testing for dispute system under load
- Security testing for access controls

## Conclusion

The Dispute Resolution System provides a comprehensive framework for handling disagreements in the escrow process. By offering multiple resolution paths and clear workflows, it increases trust in the platform and provides a safety net for both buyers and sellers.

This design document outlines the key components and implementation strategy for Phase 2, building on the foundation of the successful Phase 1 Escrow System.
