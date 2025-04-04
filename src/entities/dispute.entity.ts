import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { User } from "./user.entity";
import { Escrow } from "./escrow.entity";
import { DisputeEvidence } from "./dispute-evidence.entity";
import { DisputeMessage } from "./dispute-message.entity";

/**
 * Status of a dispute
 */
export enum DisputeStatus {
  EVIDENCE_SUBMISSION = "EVIDENCE_SUBMISSION",
  UNDER_REVIEW = "UNDER_REVIEW",
  MUTUALLY_RESOLVED = "MUTUALLY_RESOLVED",
  RESOLVED_BY_ADMIN = "RESOLVED_BY_ADMIN",
  CLOSED = "CLOSED",
  EXPIRED = "EXPIRED",
  // Legacy status values for compatibility
  OPEN = "OPEN",
  RESOLVED_FOR_CUSTOMER = "RESOLVED_FOR_CUSTOMER",
  RESOLVED_FOR_MERCHANT = "RESOLVED_FOR_MERCHANT",
  ESCALATED = "ESCALATED",
}

/**
 * Resolution type for a dispute
 */
export enum DisputeResolution {
  BUYER_REFUND = "BUYER_REFUND",
  SELLER_RECEIVE = "SELLER_RECEIVE",
  SPLIT = "SPLIT",
  CUSTOM = "CUSTOM",
}

/**
 * Reason for filing a dispute (for backwards compatibility)
 */
export enum DisputeReason {
  PRODUCT_NOT_RECEIVED = "PRODUCT_NOT_RECEIVED",
  PRODUCT_NOT_AS_DESCRIBED = "PRODUCT_NOT_AS_DESCRIBED",
  UNAUTHORIZED_CHARGE = "UNAUTHORIZED_CHARGE",
  DUPLICATE_CHARGE = "DUPLICATE_CHARGE",
  SERVICES_NOT_PROVIDED = "SERVICES_NOT_PROVIDED",
  QUALITY_ISSUES = "QUALITY_ISSUES",
  OTHER = "OTHER",
}

/**
 * Entity representing a dispute raised on an escrow
 */
@Entity("disputes")
export class Dispute {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  escrowId: string;

  @ManyToOne(() => Escrow, { onDelete: "CASCADE" })
  @JoinColumn({ name: "escrowId" })
  escrow: Escrow;

  @Column({ type: "uuid" })
  createdById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "createdById" })
  createdBy: User;

  @Column({ type: "uuid", nullable: true })
  reviewedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "reviewedById" })
  reviewedBy: User;

  @Column()
  reason: string;

  @Column({ type: "jsonb", default: "{}" })
  details: Record<string, any>;

  @Column({
    type: "enum",
    enum: DisputeStatus,
    default: DisputeStatus.EVIDENCE_SUBMISSION,
  })
  status: DisputeStatus;

  @Column({
    type: "enum",
    enum: DisputeResolution,
    nullable: true,
  })
  resolution: DisputeResolution;

  @Column({ type: "timestamp with time zone", nullable: true })
  evidenceDeadline: Date;

  @Column({ type: "timestamp with time zone", nullable: true })
  resolvedAt: Date;

  @Column({ type: "numeric", nullable: true })
  buyerAmount: number;

  @Column({ type: "numeric", nullable: true })
  sellerAmount: number;

  @Column({ type: "jsonb", default: "{}" })
  metadata: Record<string, any>;

  // Legacy properties for backwards compatibility
  @Column({ type: "uuid", nullable: true })
  paymentId: string;

  @Column({ type: "uuid", nullable: true })
  filedByUserId: string;

  @Column({ type: "uuid", nullable: true })
  resolvedByUserId: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "jsonb", nullable: true })
  evidenceFiles: string[];

  @Column({ type: "jsonb", nullable: true })
  responsePacket: Record<string, any>;

  @Column({ type: "text", nullable: true })
  resolutionNotes: string;

  @CreateDateColumn({ type: "timestamp with time zone" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  updatedAt: Date;

  @OneToMany(() => DisputeEvidence, (evidence) => evidence.dispute)
  evidence: DisputeEvidence[];

  @OneToMany(() => DisputeMessage, (message) => message.dispute)
  messages: DisputeMessage[];
}
