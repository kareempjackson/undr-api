import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from "typeorm";
import { User } from "./user.entity";
import { NotificationType } from "./notification.entity";

export enum NotificationChannel {
  IN_APP = "in_app",
  EMAIL = "email",
  SMS = "sms",
  PUSH = "push",
}

/**
 * Entity representing a user's notification preferences
 */
@Entity("notification_preferences")
@Unique(["userId", "type", "channel"])
export class NotificationPreference {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  @Index()
  user: User;

  @Column()
  userId: string;

  @Column({
    type: "enum",
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: "enum",
    enum: NotificationChannel,
  })
  channel: NotificationChannel;

  @Column({ default: true })
  enabled: boolean;

  @Column({ type: "jsonb", default: "{}" })
  settings: Record<string, any>;

  @CreateDateColumn({ type: "timestamp with time zone" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  updatedAt: Date;
}
