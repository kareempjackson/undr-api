"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateEscrowSystem1711168600000 = void 0;
class UpdateEscrowSystem1711168600000 {
    constructor() {
        this.name = "UpdateEscrowSystem1711168600000";
    }
    async up(queryRunner) {
        await queryRunner.query(`DROP TABLE IF EXISTS "escrows" CASCADE`);
        await queryRunner.query(`
            DROP TYPE IF EXISTS "public"."escrow_status_enum" CASCADE;
            CREATE TYPE "public"."escrow_status_enum" AS ENUM(
                'PENDING', 
                'DELIVERED_PENDING_RELEASE', 
                'DISPUTED', 
                'RELEASED', 
                'REFUNDED', 
                'CHARGEBACKED'
            )
        `);
        await queryRunner.query(`
            DROP TYPE IF EXISTS "public"."proof_type_enum" CASCADE;
            CREATE TYPE "public"."proof_type_enum" AS ENUM(
                'FAN_CONFIRMATION',
                'CREATOR_CONFIRMATION',
                'CONTENT_VIEW',
                'CONTENT_DOWNLOAD',
                'SYSTEM_VERIFICATION',
                'ADMIN_OVERRIDE'
            )
        `);
        await queryRunner.query(`
            DROP TYPE IF EXISTS "public"."log_type_enum" CASCADE;
            CREATE TYPE "public"."log_type_enum" AS ENUM(
                'PAYMENT_CREATED',
                'ESCROW_CREATED',
                'PROOF_SUBMITTED',
                'ESCROW_STATUS_CHANGED',
                'DISPUTE_OPENED',
                'DISPUTE_UPDATED',
                'DISPUTE_RESOLVED',
                'FUNDS_RELEASED',
                'REFUND_ISSUED',
                'ADMIN_ACTION',
                'STRIPE_WEBHOOK',
                'CHARGEBACK_RECEIVED',
                'SECURITY_EVENT'
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "escrows" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "paymentId" uuid NOT NULL,
                "status" "public"."escrow_status_enum" NOT NULL DEFAULT 'PENDING',
                "amount" decimal(10,2) NOT NULL,
                "stripePaymentIntentId" character varying,
                "fromUserId" uuid NOT NULL,
                "toUserId" uuid NOT NULL,
                "fromAlias" character varying NOT NULL,
                "toAlias" character varying NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "releasedAt" TIMESTAMP,
                "scheduleReleaseAt" TIMESTAMP NOT NULL,
                "metadata" jsonb NOT NULL DEFAULT '{}',
                "isHighRisk" boolean NOT NULL DEFAULT false,
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_escrows" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "delivery_proofs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "escrowId" uuid NOT NULL,
                "type" "public"."proof_type_enum" NOT NULL,
                "evidence" jsonb NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "verified" boolean NOT NULL DEFAULT false,
                "verifiedBy" character varying,
                "verifiedAt" TIMESTAMP,
                CONSTRAINT "PK_delivery_proofs" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "transaction_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "type" "public"."log_type_enum" NOT NULL,
                "escrowId" uuid,
                "paymentId" uuid,
                "userId" uuid,
                "alias" character varying,
                "timestamp" TIMESTAMP NOT NULL,
                "description" text NOT NULL,
                "data" jsonb NOT NULL,
                "ipHash" character varying,
                "deviceFingerprint" character varying,
                "userAgent" character varying,
                "stripePaymentIntentId" character varying,
                "stripeDisputeId" character varying,
                CONSTRAINT "PK_transaction_logs" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`CREATE INDEX "IDX_escrows_paymentId" ON "escrows" ("paymentId")`);
        await queryRunner.query(`CREATE INDEX "IDX_escrows_fromUserId" ON "escrows" ("fromUserId")`);
        await queryRunner.query(`CREATE INDEX "IDX_escrows_toUserId" ON "escrows" ("toUserId")`);
        await queryRunner.query(`CREATE INDEX "IDX_escrows_status" ON "escrows" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_delivery_proofs_escrowId" ON "delivery_proofs" ("escrowId")`);
        await queryRunner.query(`CREATE INDEX "IDX_transaction_logs_type" ON "transaction_logs" ("type")`);
        await queryRunner.query(`CREATE INDEX "IDX_transaction_logs_escrowId" ON "transaction_logs" ("escrowId")`);
        await queryRunner.query(`CREATE INDEX "IDX_transaction_logs_paymentId" ON "transaction_logs" ("paymentId")`);
        await queryRunner.query(`CREATE INDEX "IDX_transaction_logs_userId" ON "transaction_logs" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_transaction_logs_stripePaymentIntentId" ON "transaction_logs" ("stripePaymentIntentId")`);
        await queryRunner.query(`CREATE INDEX "IDX_transaction_logs_stripeDisputeId" ON "transaction_logs" ("stripeDisputeId")`);
        await queryRunner.query(`
            ALTER TABLE "escrows" 
            ADD CONSTRAINT "FK_escrows_payments" 
            FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE "escrows" 
            ADD CONSTRAINT "FK_escrows_fromUser" 
            FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE "escrows" 
            ADD CONSTRAINT "FK_escrows_toUser" 
            FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE CASCADE
        `);
        await queryRunner.query(`
            ALTER TABLE "delivery_proofs" 
            ADD CONSTRAINT "FK_delivery_proofs_escrow" 
            FOREIGN KEY ("escrowId") REFERENCES "escrows"("id") ON DELETE CASCADE
        `);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "delivery_proofs" DROP CONSTRAINT IF EXISTS "FK_delivery_proofs_escrow"`);
        await queryRunner.query(`ALTER TABLE "escrows" DROP CONSTRAINT IF EXISTS "FK_escrows_toUser"`);
        await queryRunner.query(`ALTER TABLE "escrows" DROP CONSTRAINT IF EXISTS "FK_escrows_fromUser"`);
        await queryRunner.query(`ALTER TABLE "escrows" DROP CONSTRAINT IF EXISTS "FK_escrows_payments"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transaction_logs_stripeDisputeId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transaction_logs_stripePaymentIntentId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transaction_logs_userId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transaction_logs_paymentId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transaction_logs_escrowId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_transaction_logs_type"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_delivery_proofs_escrowId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_escrows_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_escrows_toUserId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_escrows_fromUserId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_escrows_paymentId"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "transaction_logs"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "delivery_proofs"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "escrows"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."log_type_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."proof_type_enum"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."escrow_status_enum"`);
    }
}
exports.UpdateEscrowSystem1711168600000 = UpdateEscrowSystem1711168600000;
//# sourceMappingURL=1711168600000-UpdateEscrowSystem.js.map