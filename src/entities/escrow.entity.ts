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

export enum EscrowStatus {
  PENDING = "PENDING",
  FUNDED = "FUNDED",
  RELEASED = "RELEASED",
  REFUNDED = "REFUNDED",
  DISPUTED = "DISPUTED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum MilestoneStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  DISPUTED = "DISPUTED",
}

@Entity("escrow_milestones")
export class EscrowMilestone {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  escrowId: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number;

  @Column({ type: "text" })
  description: string;

  @Column({
    type: "enum",
    enum: MilestoneStatus,
    default: MilestoneStatus.PENDING,
  })
  status: MilestoneStatus;

  @Column({ type: "int" })
  sequence: number;

  @Column({ type: "timestamp", nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

@Entity("escrows")
export class Escrow {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  totalAmount: number;

  @Column({
    type: "enum",
    enum: EscrowStatus,
    default: EscrowStatus.PENDING,
  })
  status: EscrowStatus;

  @Column({ type: "text" })
  title: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "timestamp" })
  expiresAt: Date;

  @Column()
  buyerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "buyerId" })
  buyer: User;

  @Column()
  sellerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "sellerId" })
  seller: User;

  @Column({ nullable: true })
  paymentId: string;

  @ManyToOne(() => Payment, { nullable: true })
  @JoinColumn({ name: "paymentId" })
  payment: Payment;

  @OneToMany(() => EscrowMilestone, (milestone) => milestone.escrowId, {
    cascade: true,
  })
  milestones: EscrowMilestone[];

  @Column({ type: "jsonb", nullable: true })
  terms: object;

  @Column({ type: "jsonb", nullable: true })
  evidenceFiles: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: "timestamp", nullable: true })
  completedAt: Date;

  @Column({ type: "timestamp", nullable: true })
  scheduleReleaseAt: Date;
}
