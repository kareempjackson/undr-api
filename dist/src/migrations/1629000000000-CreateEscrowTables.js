"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateEscrowTables1629000000000 = void 0;
class CreateEscrowTables1629000000000 {
    async up(queryRunner) {
        await queryRunner.query(`
      CREATE TYPE "escrow_status_enum" AS ENUM (
        'PENDING',
        'DELIVERED_PENDING_RELEASE',
        'RELEASED',
        'REFUNDED',
        'DISPUTED',
        'CHARGEBACKED'
      );
    `);
        await queryRunner.query(`
      CREATE TYPE "proof_type_enum" AS ENUM (
        'SCREENSHOT',
        'TRACKING_NUMBER',
        'DIGITAL_DELIVERY',
        'CREATOR_CONFIRMATION',
        'FAN_CONFIRMATION',
        'SYSTEM_VERIFICATION',
        'ADMIN_OVERRIDE'
      );
    `);
        await queryRunner.query(`
      CREATE TYPE "log_type_enum" AS ENUM (
        'ESCROW_CREATED',
        'ESCROW_STATUS_CHANGED',
        'PROOF_SUBMITTED',
        'FUNDS_RELEASED',
        'REFUND_ISSUED',
        'DISPUTE_CREATED',
        'DISPUTE_RESOLVED',
        'CHARGEBACK_RECEIVED',
        'CHARGEBACK_CHALLENGED',
        'CHARGEBACK_RESOLVED'
      );
    `);
        await queryRunner.query(`
      CREATE TABLE "escrows" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "paymentId" uuid NOT NULL,
        "amount" decimal(10,2) NOT NULL,
        "stripePaymentIntentId" varchar(255),
        "fromUserId" uuid NOT NULL,
        "toUserId" uuid NOT NULL,
        "fromAlias" varchar(100) NOT NULL,
        "toAlias" varchar(100) NOT NULL,
        "status" "escrow_status_enum" NOT NULL DEFAULT 'PENDING',
        "scheduleReleaseAt" TIMESTAMP,
        "releasedAt" TIMESTAMP,
        "refundedAt" TIMESTAMP,
        "isHighRisk" boolean NOT NULL DEFAULT false,
        "metadata" jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_escrows" PRIMARY KEY ("id")
      );
    `);
        await queryRunner.query(`
      CREATE INDEX "IDX_escrows_paymentId" ON "escrows" ("paymentId");
      CREATE INDEX "IDX_escrows_fromUserId" ON "escrows" ("fromUserId");
      CREATE INDEX "IDX_escrows_toUserId" ON "escrows" ("toUserId");
      CREATE INDEX "IDX_escrows_status" ON "escrows" ("status");
      CREATE INDEX "IDX_escrows_stripePaymentIntentId" ON "escrows" ("stripePaymentIntentId");
    `);
        await queryRunner.query(`
      CREATE TABLE "delivery_proofs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "escrowId" uuid NOT NULL,
        "type" "proof_type_enum" NOT NULL,
        "evidence" jsonb NOT NULL,
        "verified" boolean NOT NULL DEFAULT false,
        "verifiedAt" TIMESTAMP,
        "verifiedBy" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_delivery_proofs" PRIMARY KEY ("id")
      );
    `);
        await queryRunner.query(`
      CREATE INDEX "IDX_delivery_proofs_escrowId" ON "delivery_proofs" ("escrowId");
    `);
        await queryRunner.query(`
      CREATE TABLE "transaction_logs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "type" "log_type_enum" NOT NULL,
        "escrowId" uuid,
        "paymentId" uuid,
        "userId" uuid,
        "alias" varchar(100),
        "timestamp" TIMESTAMP NOT NULL,
        "description" text NOT NULL,
        "data" jsonb NOT NULL,
        "ipHash" varchar(255),
        "deviceFingerprint" varchar(255),
        "userAgent" text,
        "stripePaymentIntentId" varchar(255),
        "stripeDisputeId" varchar(255),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_transaction_logs" PRIMARY KEY ("id")
      );
    `);
        await queryRunner.query(`
      CREATE INDEX "IDX_transaction_logs_type" ON "transaction_logs" ("type");
      CREATE INDEX "IDX_transaction_logs_escrowId" ON "transaction_logs" ("escrowId");
      CREATE INDEX "IDX_transaction_logs_paymentId" ON "transaction_logs" ("paymentId");
      CREATE INDEX "IDX_transaction_logs_userId" ON "transaction_logs" ("userId");
      CREATE INDEX "IDX_transaction_logs_timestamp" ON "transaction_logs" ("timestamp");
    `);
        await queryRunner.query(`
      ALTER TABLE "delivery_proofs" 
      ADD CONSTRAINT "FK_delivery_proofs_escrows" 
      FOREIGN KEY ("escrowId") 
      REFERENCES "escrows"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION;
    `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
      ALTER TABLE "delivery_proofs" DROP CONSTRAINT "FK_delivery_proofs_escrows";
    `);
        await queryRunner.query(`DROP TABLE "transaction_logs";`);
        await queryRunner.query(`DROP TABLE "delivery_proofs";`);
        await queryRunner.query(`DROP TABLE "escrows";`);
        await queryRunner.query(`DROP TYPE "log_type_enum";`);
        await queryRunner.query(`DROP TYPE "proof_type_enum";`);
        await queryRunner.query(`DROP TYPE "escrow_status_enum";`);
    }
}
exports.CreateEscrowTables1629000000000 = CreateEscrowTables1629000000000;
//# sourceMappingURL=1629000000000-CreateEscrowTables.js.map