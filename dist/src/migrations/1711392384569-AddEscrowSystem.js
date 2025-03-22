"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddEscrowSystem1711392384569 = void 0;
class AddEscrowSystem1711392384569 {
    constructor() {
        this.name = "AddEscrowSystem1711392384569";
    }
    async up(queryRunner) {
        await queryRunner.query(`
            CREATE TABLE "escrows" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying NOT NULL,
                "description" text,
                "totalAmount" numeric(10,2) NOT NULL,
                "buyerId" uuid NOT NULL,
                "sellerId" uuid NOT NULL,
                "status" character varying NOT NULL DEFAULT 'PENDING',
                "expiresAt" TIMESTAMP WITH TIME ZONE,
                "completedAt" TIMESTAMP WITH TIME ZONE,
                "cancelledAt" TIMESTAMP WITH TIME ZONE,
                "cancellationReason" text,
                "terms" jsonb,
                "evidenceFiles" text array,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_escrows" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "escrow_milestones" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "escrowId" uuid NOT NULL,
                "amount" numeric(10,2) NOT NULL,
                "description" text NOT NULL,
                "sequence" integer NOT NULL,
                "status" character varying NOT NULL DEFAULT 'PENDING',
                "completedAt" TIMESTAMP WITH TIME ZONE,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_escrow_milestones" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "delivery_proofs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "escrowId" uuid NOT NULL,
                "type" character varying NOT NULL,
                "description" text NOT NULL,
                "files" text array,
                "status" character varying NOT NULL DEFAULT 'PENDING',
                "rejectionReason" text,
                "reviewerId" uuid,
                "reviewedAt" TIMESTAMP WITH TIME ZONE,
                "metadata" jsonb,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_delivery_proofs" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE TABLE "transaction_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "type" character varying NOT NULL,
                "userId" uuid NOT NULL,
                "entityId" uuid NOT NULL,
                "entityType" character varying NOT NULL,
                "data" jsonb,
                "ipAddress" character varying,
                "userAgent" character varying,
                "metadata" jsonb,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_transaction_logs" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "escrows" 
            ADD CONSTRAINT "FK_escrows_buyer" 
            FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "escrows" 
            ADD CONSTRAINT "FK_escrows_seller" 
            FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "escrow_milestones" 
            ADD CONSTRAINT "FK_escrow_milestones_escrow" 
            FOREIGN KEY ("escrowId") REFERENCES "escrows"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "delivery_proofs" 
            ADD CONSTRAINT "FK_delivery_proofs_escrow" 
            FOREIGN KEY ("escrowId") REFERENCES "escrows"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            ALTER TABLE "delivery_proofs" 
            ADD CONSTRAINT "FK_delivery_proofs_reviewer" 
            FOREIGN KEY ("reviewerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_escrows_buyer" ON "escrows" ("buyerId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_escrows_seller" ON "escrows" ("sellerId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_escrows_status" ON "escrows" ("status")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_escrow_milestones_escrow" ON "escrow_milestones" ("escrowId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_delivery_proofs_escrow" ON "delivery_proofs" ("escrowId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_transaction_logs_user" ON "transaction_logs" ("userId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_transaction_logs_entity" ON "transaction_logs" ("entityId")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_transaction_logs_type" ON "transaction_logs" ("type")
        `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_transaction_logs_type"`);
        await queryRunner.query(`DROP INDEX "IDX_transaction_logs_entity"`);
        await queryRunner.query(`DROP INDEX "IDX_transaction_logs_user"`);
        await queryRunner.query(`DROP INDEX "IDX_delivery_proofs_escrow"`);
        await queryRunner.query(`DROP INDEX "IDX_escrow_milestones_escrow"`);
        await queryRunner.query(`DROP INDEX "IDX_escrows_status"`);
        await queryRunner.query(`DROP INDEX "IDX_escrows_seller"`);
        await queryRunner.query(`DROP INDEX "IDX_escrows_buyer"`);
        await queryRunner.query(`ALTER TABLE "delivery_proofs" DROP CONSTRAINT "FK_delivery_proofs_reviewer"`);
        await queryRunner.query(`ALTER TABLE "delivery_proofs" DROP CONSTRAINT "FK_delivery_proofs_escrow"`);
        await queryRunner.query(`ALTER TABLE "escrow_milestones" DROP CONSTRAINT "FK_escrow_milestones_escrow"`);
        await queryRunner.query(`ALTER TABLE "escrows" DROP CONSTRAINT "FK_escrows_seller"`);
        await queryRunner.query(`ALTER TABLE "escrows" DROP CONSTRAINT "FK_escrows_buyer"`);
        await queryRunner.query(`DROP TABLE "transaction_logs"`);
        await queryRunner.query(`DROP TABLE "delivery_proofs"`);
        await queryRunner.query(`DROP TABLE "escrow_milestones"`);
        await queryRunner.query(`DROP TABLE "escrows"`);
    }
}
exports.AddEscrowSystem1711392384569 = AddEscrowSystem1711392384569;
//# sourceMappingURL=1711392384569-AddEscrowSystem.js.map