import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Payment } from "./payment.entity";
import { User } from "./user.entity";

export enum RiskLevel {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum RiskFlag {
  UNUSUAL_LOCATION = "UNUSUAL_LOCATION",
  MULTIPLE_FAILED_ATTEMPTS = "MULTIPLE_FAILED_ATTEMPTS",
  RAPID_SUCCESSION_PAYMENTS = "RAPID_SUCCESSION_PAYMENTS",
  LARGE_TRANSACTION = "LARGE_TRANSACTION",
  NEW_PAYMENT_METHOD = "NEW_PAYMENT_METHOD",
  UNUSUAL_TIME = "UNUSUAL_TIME",
  IP_MISMATCH = "IP_MISMATCH",
  DEVICE_CHANGE = "DEVICE_CHANGE",
  BEHAVIORAL_ANOMALY = "BEHAVIORAL_ANOMALY",
}

@Entity("risk_assessments")
export class RiskAssessment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  paymentId: string;

  @ManyToOne(() => Payment, { nullable: true })
  @JoinColumn({ name: "paymentId" })
  payment: Payment;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({
    type: "enum",
    enum: RiskLevel,
    default: RiskLevel.LOW,
  })
  riskLevel: RiskLevel;

  @Column({ type: "jsonb", default: [] })
  riskFlags: RiskFlag[];

  @Column({ type: "decimal", precision: 5, scale: 2, default: 0 })
  riskScore: number;

  @Column({ type: "text", nullable: true })
  riskDetails: string;

  @Column({ type: "jsonb", nullable: true })
  deviceInfo: object;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  location: string;

  @Column({ default: false })
  requires3ds: boolean;

  @Column({ default: false })
  requiresMfa: boolean;

  @Column({ default: false })
  blocked: boolean;

  @Column({ default: true })
  reviewRequired: boolean;

  @Column({ nullable: true })
  reviewedByUserId: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "reviewedByUserId" })
  reviewedByUser: User;

  @Column({ type: "text", nullable: true })
  reviewNotes: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: "timestamp", nullable: true })
  reviewedAt: Date;
}
