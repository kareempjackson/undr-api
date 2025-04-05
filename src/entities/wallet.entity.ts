import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./user.entity";
import { encryptedColumn } from "../modules/common/transformers/encrypted-column.factory";

@Entity("wallets")
export class Wallet {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
    //transformer: encryptedColumn(),
  })
  balance: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  userId: string;

  @OneToOne(() => User, (user) => user.wallet)
  @JoinColumn({ name: "userId" })
  user: User;

  @Column({ default: false })
  chargebackBuffer: boolean;
}
