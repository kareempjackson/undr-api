"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddScheduleReleaseAtToEscrow1742684675599 = void 0;
class AddScheduleReleaseAtToEscrow1742684675599 {
    constructor() {
        this.name = 'AddScheduleReleaseAtToEscrow1742684675599';
    }
    async up(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."users_email_hash_idx"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_users_alias"`);
        await queryRunner.query(`CREATE TYPE "public"."transaction_logs_type_enum" AS ENUM('ESCROW_CREATED', 'ESCROW_FUNDED', 'ESCROW_PROOF_SUBMITTED', 'ESCROW_PROOF_REVIEWED', 'ESCROW_COMPLETED', 'ESCROW_CANCELLED', 'ESCROW_REFUNDED', 'ESCROW_DISPUTED', 'ESCROW_TERMS_UPDATED', 'MILESTONE_UPDATED')`);
        await queryRunner.query(`CREATE TABLE "transaction_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."transaction_logs_type_enum" NOT NULL, "userId" uuid, "entityId" uuid, "entityType" text NOT NULL, "data" jsonb NOT NULL, "ipAddress" inet, "userAgent" text, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c7605f13413f4b5d06e53f2349b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."delivery_proofs_type_enum" AS ENUM('IMAGE', 'DOCUMENT', 'VIDEO', 'LINK', 'TEXT')`);
        await queryRunner.query(`CREATE TYPE "public"."delivery_proofs_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED')`);
        await queryRunner.query(`CREATE TABLE "delivery_proofs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "escrowId" uuid NOT NULL, "submittedById" uuid NOT NULL, "type" "public"."delivery_proofs_type_enum" NOT NULL, "description" text, "files" jsonb NOT NULL, "status" "public"."delivery_proofs_status_enum" NOT NULL DEFAULT 'PENDING', "reviewedById" uuid, "rejectionReason" text, "reviewedAt" TIMESTAMP, "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_a7fac8a81fd452f3655063c1bd3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_hash"`);
        await queryRunner.query(`ALTER TABLE "escrows" ADD "scheduleReleaseAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "balance"`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD "balance" numeric(10,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "amount"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "amount" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "description" character varying`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "externalId"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "externalId" character varying`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "fromAlias"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "fromAlias" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "toAlias"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "toAlias" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "email" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "name" character varying`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "users_alias_key"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "alias"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "alias" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_f002c336d3299ee4eba00196902" UNIQUE ("alias")`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phoneNumber"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "phoneNumber" character varying`);
        await queryRunner.query(`CREATE INDEX "IDX_f002c336d3299ee4eba0019690" ON "users" ("alias") `);
        await queryRunner.query(`ALTER TABLE "transaction_logs" ADD CONSTRAINT "FK_df5c77db6fc7d0d09fac8dfe7b9" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "delivery_proofs" ADD CONSTRAINT "FK_0341b409eb4f03d62e20f746678" FOREIGN KEY ("escrowId") REFERENCES "escrows"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "delivery_proofs" ADD CONSTRAINT "FK_fa1286ccaa70a454f6554fc39ce" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "delivery_proofs" ADD CONSTRAINT "FK_4ee9828586d6690560bd9e5df69" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "delivery_proofs" DROP CONSTRAINT "FK_4ee9828586d6690560bd9e5df69"`);
        await queryRunner.query(`ALTER TABLE "delivery_proofs" DROP CONSTRAINT "FK_fa1286ccaa70a454f6554fc39ce"`);
        await queryRunner.query(`ALTER TABLE "delivery_proofs" DROP CONSTRAINT "FK_0341b409eb4f03d62e20f746678"`);
        await queryRunner.query(`ALTER TABLE "transaction_logs" DROP CONSTRAINT "FK_df5c77db6fc7d0d09fac8dfe7b9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f002c336d3299ee4eba0019690"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phoneNumber"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "phoneNumber" text`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_f002c336d3299ee4eba00196902"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "alias"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "alias" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "users_alias_key" UNIQUE ("alias")`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "name" text`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "email" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email")`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "toAlias"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "toAlias" text NOT NULL DEFAULT 'anonymous'`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "fromAlias"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "fromAlias" text NOT NULL DEFAULT 'anonymous'`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "externalId"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "externalId" text`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "description"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "description" text`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "amount"`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "amount" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "wallets" DROP COLUMN "balance"`);
        await queryRunner.query(`ALTER TABLE "wallets" ADD "balance" text NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "escrows" DROP COLUMN "scheduleReleaseAt"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "email_hash" bytea`);
        await queryRunner.query(`DROP TABLE "delivery_proofs"`);
        await queryRunner.query(`DROP TYPE "public"."delivery_proofs_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."delivery_proofs_type_enum"`);
        await queryRunner.query(`DROP TABLE "transaction_logs"`);
        await queryRunner.query(`DROP TYPE "public"."transaction_logs_type_enum"`);
        await queryRunner.query(`CREATE INDEX "IDX_users_alias" ON "users" ("alias") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "users_email_hash_idx" ON "users" ("email_hash") `);
    }
}
exports.AddScheduleReleaseAtToEscrow1742684675599 = AddScheduleReleaseAtToEscrow1742684675599;
//# sourceMappingURL=1742684675599-AddScheduleReleaseAtToEscrow.js.map