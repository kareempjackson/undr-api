import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./user.entity";

/**
 * Type of notification
 */
export enum NotificationType {
  // Escrow related notifications
  ESCROW_CREATED = "escrow_created",
  ESCROW_FUNDED = "escrow_funded",
  ESCROW_COMPLETED = "escrow_completed",
  ESCROW_RELEASED = "escrow_released",

  // Milestone related notifications
  MILESTONE_COMPLETED = "MILESTONE_COMPLETED",
  MILESTONE_UPDATED = "MILESTONE_UPDATED",

  // Delivery proof related notifications
  PROOF_SUBMITTED = "proof_submitted",
  PROOF_APPROVED = "proof_approved",
  PROOF_REJECTED = "proof_rejected",

  // Dispute related notifications
  DISPUTE_CREATED = "dispute_created",
  DISPUTE_RESOLVED = "dispute_resolved",
  DISPUTE_EVIDENCE = "dispute_evidence",
  DISPUTE_MESSAGE = "dispute_message",

  // Payment related notifications
  PAYMENT_RECEIVED = "payment_received",
  PAYMENT_SENT = "payment_sent",

  // System notifications
  SYSTEM = "system",
  SYSTEM_ANNOUNCEMENT = "SYSTEM_ANNOUNCEMENT",
  SECURITY_ALERT = "SECURITY_ALERT",
}

/**
 * Channel through which notification can be delivered
 */
export enum NotificationChannel {
  IN_APP = "IN_APP",
  EMAIL = "EMAIL",
  PUSH = "PUSH",
}

/**
 * Entity representing a notification sent to a user
 */
@Entity("notifications")
export class Notification {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  @Index()
  user: User;

  @Column()
  userId: string;

  @Column({
    type: "enum",
    enum: NotificationType,
    default: NotificationType.SYSTEM,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: "text" })
  message: string;

  @Column({ type: "jsonb", default: "{}" })
  data: Record<string, any>;

  @Column({
    type: "enum",
    enum: NotificationChannel,
    default: NotificationChannel.IN_APP,
  })
  channel: NotificationChannel;

  @Column({ default: false })
  isRead: boolean;

  @Column({ type: "timestamp with time zone", nullable: true })
  readAt: Date;

  @Column({ nullable: true })
  targetUrl: string;

  @Column({ nullable: true })
  actionUrl: string;

  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: "timestamp with time zone" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  updatedAt: Date;
}
