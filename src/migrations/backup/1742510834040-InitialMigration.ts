import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1742510834040 implements MigrationInterface {
  name = "InitialMigration1742510834040";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "wallets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "balance" numeric(10,2) NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, CONSTRAINT "REL_2ecdb33f23e9a6fc392025c0b9" UNIQUE ("userId"), CONSTRAINT "PK_8402e5df5a30a229380e83e4f7e" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_status_enum" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_method_enum" AS ENUM('WALLET', 'CREDIT_CARD', 'CRYPTO_BTC', 'CRYPTO_ETH', 'CRYPTO_USDT')`
    );
    await queryRunner.query(
      `CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" numeric(10,2) NOT NULL, "status" "public"."payments_status_enum" NOT NULL DEFAULT 'PENDING', "method" "public"."payments_method_enum" NOT NULL, "description" character varying, "externalId" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "fromUserId" uuid NOT NULL, "toUserId" uuid NOT NULL, CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."deposits_status_enum" AS ENUM('PENDING', 'COMPLETED', 'FAILED')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."deposits_method_enum" AS ENUM('WALLET', 'CREDIT_CARD', 'CRYPTO_BTC', 'CRYPTO_ETH', 'CRYPTO_USDT')`
    );
    await queryRunner.query(
      `CREATE TABLE "deposits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" numeric(10,2) NOT NULL, "status" "public"."deposits_status_enum" NOT NULL DEFAULT 'PENDING', "method" "public"."deposits_method_enum" NOT NULL, "transactionId" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, CONSTRAINT "PK_f49ba0cd446eaf7abb4953385d9" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "magic_links" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "token" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "used" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, CONSTRAINT "PK_6c609d48037f164e7ae5b744b18" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'CREATOR', 'FAN')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_status_enum" AS ENUM('ACTIVE', 'PENDING', 'SUSPENDED', 'DELETED')`
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "name" character varying, "role" "public"."users_role_enum" NOT NULL DEFAULT 'FAN', "status" "public"."users_status_enum" NOT NULL DEFAULT 'PENDING', "profileImage" character varying, "bio" character varying, "location" character varying, "emailVerified" boolean NOT NULL DEFAULT false, "featured" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."withdrawals_status_enum" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'REJECTED')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."withdrawals_method_enum" AS ENUM('WALLET', 'CREDIT_CARD', 'CRYPTO_BTC', 'CRYPTO_ETH', 'CRYPTO_USDT')`
    );
    await queryRunner.query(
      `CREATE TABLE "withdrawals" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "amount" numeric(10,2) NOT NULL, "status" "public"."withdrawals_status_enum" NOT NULL DEFAULT 'PENDING', "method" "public"."withdrawals_method_enum" NOT NULL, "payoutDetails" jsonb, "transactionId" character varying, "rejectionReason" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid NOT NULL, CONSTRAINT "PK_9871ec481baa7755f8bd8b7c7e9" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD CONSTRAINT "FK_2ecdb33f23e9a6fc392025c0b97" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_e70879230925c0b8d7c0148ea42" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_8b22c286a7aa80a74ab47db1c36" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "deposits" ADD CONSTRAINT "FK_968bcd26d29022f95d20bb70e21" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "magic_links" ADD CONSTRAINT "FK_1c64b8995a08697016868c80186" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "withdrawals" ADD CONSTRAINT "FK_79a3949e02a4652fb2b2a0ccd4e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "withdrawals" DROP CONSTRAINT "FK_79a3949e02a4652fb2b2a0ccd4e"`
    );
    await queryRunner.query(
      `ALTER TABLE "magic_links" DROP CONSTRAINT "FK_1c64b8995a08697016868c80186"`
    );
    await queryRunner.query(
      `ALTER TABLE "deposits" DROP CONSTRAINT "FK_968bcd26d29022f95d20bb70e21"`
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_8b22c286a7aa80a74ab47db1c36"`
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_e70879230925c0b8d7c0148ea42"`
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP CONSTRAINT "FK_2ecdb33f23e9a6fc392025c0b97"`
    );
    await queryRunner.query(`DROP TABLE "withdrawals"`);
    await queryRunner.query(`DROP TYPE "public"."withdrawals_method_enum"`);
    await queryRunner.query(`DROP TYPE "public"."withdrawals_status_enum"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
    await queryRunner.query(`DROP TABLE "magic_links"`);
    await queryRunner.query(`DROP TABLE "deposits"`);
    await queryRunner.query(`DROP TYPE "public"."deposits_method_enum"`);
    await queryRunner.query(`DROP TYPE "public"."deposits_status_enum"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TYPE "public"."payments_method_enum"`);
    await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
    await queryRunner.query(`DROP TABLE "wallets"`);
  }
}
