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
import { Payment } from "./payment.entity";

export enum DisputeStatus {
  OPEN = "OPEN",
  UNDER_REVIEW = "UNDER_REVIEW",
  RESOLVED_FOR_MERCHANT = "RESOLVED_FOR_MERCHANT",
  RESOLVED_FOR_CUSTOMER = "RESOLVED_FOR_CUSTOMER",
  ESCALATED = "ESCALATED",
  CLOSED = "CLOSED",
}

export enum DisputeReason {
  PRODUCT_NOT_RECEIVED = "PRODUCT_NOT_RECEIVED",
  PRODUCT_NOT_AS_DESCRIBED = "PRODUCT_NOT_AS_DESCRIBED",
  UNAUTHORIZED_TRANSACTION = "UNAUTHORIZED_TRANSACTION",
  DUPLICATE_TRANSACTION = "DUPLICATE_TRANSACTION",
  SUBSCRIPTION_CANCELED = "SUBSCRIPTION_CANCELED",
  OTHER = "OTHER",
}

@Entity("disputes")
export class Dispute {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  paymentId: string;

  @ManyToOne(() => Payment)
  @JoinColumn({ name: "paymentId" })
  payment: Payment;

  @Column()
  filedByUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "filedByUserId" })
  filedByUser: User;

  @Column({
    type: "enum",
    enum: DisputeStatus,
    default: DisputeStatus.OPEN,
  })
  status: DisputeStatus;

  @Column({
    type: "enum",
    enum: DisputeReason,
  })
  reason: DisputeReason;

  @Column({ type: "text" })
  description: string;

  @Column({ type: "jsonb", nullable: true })
  evidenceFiles: string[];

  @Column({ type: "jsonb", nullable: true })
  responsePacket: object;

  @Column({ type: "text", nullable: true })
  resolutionNotes: string;

  @Column({ nullable: true })
  resolvedByUserId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "resolvedByUserId" })
  resolvedByUser: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: "timestamp", nullable: true })
  resolvedAt: Date;
}
