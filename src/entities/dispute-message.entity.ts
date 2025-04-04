import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";
import { Dispute } from "./dispute.entity";

/**
 * Entity representing a message in a dispute conversation
 */
@Entity("dispute_messages")
export class DisputeMessage {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  disputeId: string;

  @ManyToOne(() => Dispute)
  @JoinColumn({ name: "disputeId" })
  dispute: Dispute;

  @Column()
  senderId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "senderId" })
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
