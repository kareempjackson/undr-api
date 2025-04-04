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
 * Types of evidence that can be submitted for a dispute
 */
export enum EvidenceType {
  TEXT = "TEXT",
  IMAGE = "IMAGE",
  DOCUMENT = "DOCUMENT",
  VIDEO = "VIDEO",
  OTHER = "OTHER",
}

/**
 * Entity representing evidence submitted for a dispute
 */
@Entity("dispute_evidence")
export class DisputeEvidence {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid" })
  disputeId: string;

  @ManyToOne(() => Dispute, (dispute) => dispute.evidence, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "disputeId" })
  dispute: Dispute;

  @Column({ type: "uuid" })
  submittedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "submittedById" })
  submittedBy: User;

  @Column({
    type: "enum",
    enum: EvidenceType,
  })
  type: EvidenceType;

  @Column({ type: "text" })
  description: string;

  @Column({ type: "jsonb", default: "[]" })
  files: any[];

  @Column({ type: "jsonb", default: "{}" })
  metadata: Record<string, any>;

  @CreateDateColumn({ type: "timestamp with time zone" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  updatedAt: Date;
}
