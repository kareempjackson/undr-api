import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";

export enum TransactionType {
  ESCROW_CREATED = "ESCROW_CREATED",
  ESCROW_FUNDED = "ESCROW_FUNDED",
  ESCROW_PROOF_SUBMITTED = "ESCROW_PROOF_SUBMITTED",
  ESCROW_PROOF_REVIEWED = "ESCROW_PROOF_REVIEWED",
  ESCROW_COMPLETED = "ESCROW_COMPLETED",
  ESCROW_CANCELLED = "ESCROW_CANCELLED",
  ESCROW_REFUNDED = "ESCROW_REFUNDED",
  ESCROW_DISPUTED = "ESCROW_DISPUTED",
  ESCROW_TERMS_UPDATED = "ESCROW_TERMS_UPDATED",
  MILESTONE_UPDATED = "MILESTONE_UPDATED",
  CHARGEBACK_BUFFER_ALLOCATION = "CHARGEBACK_BUFFER_ALLOCATION",
  CHARGEBACK_BUFFER_DEDUCTION = "CHARGEBACK_BUFFER_DEDUCTION",
}

@Entity("transaction_logs")
export class TransactionLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "enum", enum: TransactionType })
  type: TransactionType;

  @Column({ nullable: true })
  userId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({ type: "uuid", nullable: true })
  entityId: string;

  @Column({ type: "text" })
  entityType: string;

  @Column({ type: "jsonb" })
  data: Record<string, any>;

  @Column({ type: "inet", nullable: true })
  ipAddress: string;

  @Column({ type: "text", nullable: true })
  userAgent: string;

  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: "text", nullable: true })
  action: string;

  @Column({ type: "jsonb", nullable: true })
  details: Record<string, any>;

  @Column({ type: "decimal", precision: 20, scale: 8, nullable: true })
  amount: number;

  @Column({ type: "text", default: "info", nullable: true })
  level: string;
}
