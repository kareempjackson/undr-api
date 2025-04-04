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
import { encryptedColumn } from "../modules/common/transformers/encrypted-column.factory";
import { PaymentMethod, PaymentStatus, ThreeDsStatus } from "./common.enums";

@Entity("payments")
export class Payment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    transformer: encryptedColumn(),
  })
  amount: number;

  @Column({
    type: "enum",
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({
    type: "enum",
    enum: PaymentMethod,
  })
  method: PaymentMethod;

  @Column({
    nullable: true,
    transformer: encryptedColumn(),
  })
  description: string;

  @Column({
    nullable: true,
    transformer: encryptedColumn(),
  })
  externalId: string;

  // Fraud prevention and 3DS fields
  @Column({
    type: "enum",
    enum: ThreeDsStatus,
    default: ThreeDsStatus.NOT_REQUIRED,
    nullable: true,
  })
  threeDsStatus: ThreeDsStatus;

  @Column({ nullable: true })
  threeDsUrl: string;

  @Column({ type: "jsonb", nullable: true })
  threeDsResult: object;

  @Column({ type: "decimal", precision: 5, scale: 2, default: 0 })
  riskScore: number;

  @Column({ default: false })
  hasDispute: boolean;

  @Column({ default: false })
  isHighRisk: boolean;

  @Column({ nullable: true })
  ipAddress: string;

  @Column({ type: "jsonb", nullable: true })
  deviceInfo: object;

  @Column({ nullable: true })
  browserInfo: string;

  @Column({ default: false })
  isInternational: boolean;

  @Column({
    type: "jsonb",
    nullable: true,
    transformer: encryptedColumn(),
  })
  invoiceDetails: object;

  @Column({
    type: "jsonb",
    nullable: true,
    transformer: encryptedColumn(),
  })
  receiptData: object;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: false })
  fromUserId: string;

  @Column({ nullable: false })
  toUserId: string;

  @Column({
    nullable: false,
    transformer: encryptedColumn(),
  })
  fromAlias: string;

  @Column({
    nullable: false,
    transformer: encryptedColumn(),
  })
  toAlias: string;

  @Column({ type: "jsonb", nullable: true })
  metadata: object;

  @ManyToOne(() => User, (user) => user.paymentsSent)
  @JoinColumn({ name: "fromUserId" })
  fromUser: User;

  @ManyToOne(() => User, (user) => user.paymentsReceived)
  @JoinColumn({ name: "toUserId" })
  toUser: User;
}
