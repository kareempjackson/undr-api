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
import { Escrow } from "./escrow.entity";

export enum ProofType {
  IMAGE = "IMAGE",
  DOCUMENT = "DOCUMENT",
  VIDEO = "VIDEO",
  LINK = "LINK",
  TEXT = "TEXT",
}

export enum ProofStatus {
  PENDING = "PENDING",
  ACCEPTED = "ACCEPTED",
  REJECTED = "REJECTED",
}

@Entity("delivery_proofs")
export class DeliveryProof {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  escrowId: string;

  @ManyToOne(() => Escrow)
  @JoinColumn({ name: "escrowId" })
  escrow: Escrow;

  @Column()
  submittedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "submittedById" })
  submittedBy: User;

  @Column({ type: "enum", enum: ProofType })
  type: ProofType;

  @Column({ type: "text", nullable: true })
  description: string;

  @Column({ type: "jsonb" })
  files: string[];

  @Column({ type: "enum", enum: ProofStatus, default: ProofStatus.PENDING })
  status: ProofStatus;

  @Column({ nullable: true })
  reviewedById: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "reviewedById" })
  reviewedBy: User;

  @Column({ type: "text", nullable: true })
  rejectionReason: string;

  @Column({ type: "timestamp", nullable: true })
  reviewedAt: Date;

  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
