import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";
import { PaymentMethod, WithdrawalStatus } from "./common.enums";

@Entity("withdrawals")
export class Withdrawal {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: "enum",
    enum: WithdrawalStatus,
    default: WithdrawalStatus.PENDING,
  })
  status: WithdrawalStatus;

  @Column({
    type: "enum",
    enum: PaymentMethod,
  })
  method: PaymentMethod;

  @Column({ type: "jsonb", nullable: true })
  payoutDetails: Record<string, any>;

  @Column({ nullable: true })
  transactionId: string;

  @Column({ nullable: true })
  rejectionReason: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.withdrawals)
  @JoinColumn({ name: "userId" })
  user: User;
}
