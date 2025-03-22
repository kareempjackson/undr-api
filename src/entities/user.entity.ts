import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
} from "typeorm";
import { Wallet } from "./wallet.entity";
import { Payment } from "./payment.entity";
import { Deposit } from "./deposit.entity";
import { Withdrawal } from "./withdrawal.entity";
import { MagicLink } from "./magic-link.entity";
import { encryptedColumn } from "../modules/common/transformers/encrypted-column.factory";

export enum UserRole {
  ADMIN = "ADMIN",
  CREATOR = "CREATOR",
  FAN = "FAN",
  AGENCY = "AGENCY",
}

export enum UserStatus {
  ACTIVE = "ACTIVE",
  PENDING = "PENDING",
  SUSPENDED = "SUSPENDED",
  DELETED = "DELETED",
}

export enum MfaMethod {
  NONE = "NONE",
  EMAIL = "EMAIL",
  SMS = "SMS",
  AUTHENTICATOR = "AUTHENTICATOR",
  BIOMETRIC = "BIOMETRIC",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    unique: true,
    transformer: encryptedColumn(),
  })
  email: string;

  @Column({
    nullable: true,
    transformer: encryptedColumn(),
  })
  name: string;

  @Column({
    unique: true,
    nullable: true,
  })
  @Index()
  alias: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.FAN,
  })
  role: UserRole;

  @Column({
    type: "enum",
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  status: UserStatus;

  @Column({ nullable: true })
  profileImage: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ nullable: true })
  location: string;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ default: false })
  featured: boolean;

  // Security and MFA settings
  @Column({
    type: "enum",
    enum: MfaMethod,
    default: MfaMethod.NONE,
  })
  mfaMethod: MfaMethod;

  @Column({ nullable: true })
  mfaSecret: string;

  @Column({ default: false })
  mfaEnabled: boolean;

  @Column({ default: false })
  highSecurityMode: boolean;

  @Column({ type: "jsonb", default: [] })
  trustedDevices: object[];

  @Column({ type: "jsonb", default: [] })
  loginHistory: object[];

  @Column({
    nullable: true,
    transformer: encryptedColumn(),
  })
  phoneNumber: string;

  @Column({ default: false })
  phoneVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToOne(() => Wallet, (wallet) => wallet.user, { cascade: true })
  wallet: Wallet;

  @OneToMany(() => Payment, (payment) => payment.fromUser)
  paymentsSent: Payment[];

  @OneToMany(() => Payment, (payment) => payment.toUser)
  paymentsReceived: Payment[];

  @OneToMany(() => Deposit, (deposit) => deposit.user)
  deposits: Deposit[];

  @OneToMany(() => Withdrawal, (withdrawal) => withdrawal.user)
  withdrawals: Withdrawal[];

  @OneToMany(() => MagicLink, (magicLink) => magicLink.user)
  magicLinks: MagicLink[];
}
