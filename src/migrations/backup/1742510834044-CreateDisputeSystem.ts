import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDisputeSystem1711500000000 implements MigrationInterface {
  name = "CreateDisputeSystem1711500000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create the dispute status and resolution enums
    await queryRunner.query(`
      CREATE TYPE "public"."dispute_status_enum" AS ENUM(
        'EVIDENCE_SUBMISSION',
        'UNDER_REVIEW',
        'MUTUALLY_RESOLVED',
        'RESOLVED_BY_ADMIN',
        'CLOSED',
        'EXPIRED'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."dispute_resolution_enum" AS ENUM(
        'BUYER_REFUND',
        'SELLER_RECEIVE',
        'SPLIT',
        'CUSTOM'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."evidence_type_enum" AS ENUM(
        'TEXT',
        'IMAGE',
        'DOCUMENT',
        'VIDEO',
        'OTHER'
      )
    `);

    // Create the disputes table
    await queryRunner.query(`
      CREATE TABLE "disputes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "escrowId" uuid NOT NULL,
        "createdById" uuid NOT NULL,
        "reviewedById" uuid,
        "reason" character varying NOT NULL,
        "details" jsonb NOT NULL DEFAULT '{}',
        "status" "public"."dispute_status_enum" NOT NULL DEFAULT 'EVIDENCE_SUBMISSION',
        "resolution" "public"."dispute_resolution_enum",
        "evidenceDeadline" TIMESTAMP WITH TIME ZONE,
        "resolvedAt" TIMESTAMP WITH TIME ZONE,
        "buyerAmount" numeric,
        "sellerAmount" numeric,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_disputes" PRIMARY KEY ("id")
      )
    `);

    // Create the dispute_evidence table
    await queryRunner.query(`
      CREATE TABLE "dispute_evidence" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "disputeId" uuid NOT NULL,
        "submittedById" uuid NOT NULL,
        "type" "public"."evidence_type_enum" NOT NULL,
        "description" text NOT NULL,
        "files" jsonb NOT NULL DEFAULT '[]',
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_dispute_evidence" PRIMARY KEY ("id")
      )
    `);

    // Create the dispute_messages table
    await queryRunner.query(`
      CREATE TABLE "dispute_messages" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "disputeId" uuid NOT NULL,
        "senderId" uuid NOT NULL,
        "message" text NOT NULL,
        "isSystemMessage" boolean NOT NULL DEFAULT false,
        "metadata" jsonb NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_dispute_messages" PRIMARY KEY ("id")
      )
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "disputes"
      ADD CONSTRAINT "FK_disputes_escrows"
      FOREIGN KEY ("escrowId")
      REFERENCES "escrows"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "disputes"
      ADD CONSTRAINT "FK_disputes_created_by"
      FOREIGN KEY ("createdById")
      REFERENCES "users"("id")
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "disputes"
      ADD CONSTRAINT "FK_disputes_reviewed_by"
      FOREIGN KEY ("reviewedById")
      REFERENCES "users"("id")
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "dispute_evidence"
      ADD CONSTRAINT "FK_dispute_evidence_disputes"
      FOREIGN KEY ("disputeId")
      REFERENCES "disputes"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "dispute_evidence"
      ADD CONSTRAINT "FK_dispute_evidence_submitted_by"
      FOREIGN KEY ("submittedById")
      REFERENCES "users"("id")
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "dispute_messages"
      ADD CONSTRAINT "FK_dispute_messages_disputes"
      FOREIGN KEY ("disputeId")
      REFERENCES "disputes"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "dispute_messages"
      ADD CONSTRAINT "FK_dispute_messages_sender"
      FOREIGN KEY ("senderId")
      REFERENCES "users"("id")
      ON DELETE NO ACTION
      ON UPDATE NO ACTION
    `);

    // Add index for faster queries
    await queryRunner.query(`
      CREATE INDEX "IDX_disputes_escrow_id" ON "disputes" ("escrowId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_disputes_created_by" ON "disputes" ("createdById")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_disputes_status" ON "disputes" ("status")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_dispute_evidence_dispute_id" ON "dispute_evidence" ("disputeId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_dispute_messages_dispute_id" ON "dispute_messages" ("disputeId")
    `);

    // Update escrow entity to add DISPUTED status
    await queryRunner.query(`
      ALTER TYPE "public"."escrow_status_enum" ADD VALUE IF NOT EXISTS 'DISPUTED'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove foreign key constraints
    await queryRunner.query(`
      DROP INDEX "IDX_dispute_messages_dispute_id"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_dispute_evidence_dispute_id"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_disputes_status"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_disputes_created_by"
    `);

    await queryRunner.query(`
      DROP INDEX "IDX_disputes_escrow_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "dispute_messages"
      DROP CONSTRAINT "FK_dispute_messages_sender"
    `);

    await queryRunner.query(`
      ALTER TABLE "dispute_messages"
      DROP CONSTRAINT "FK_dispute_messages_disputes"
    `);

    await queryRunner.query(`
      ALTER TABLE "dispute_evidence"
      DROP CONSTRAINT "FK_dispute_evidence_submitted_by"
    `);

    await queryRunner.query(`
      ALTER TABLE "dispute_evidence"
      DROP CONSTRAINT "FK_dispute_evidence_disputes"
    `);

    await queryRunner.query(`
      ALTER TABLE "disputes"
      DROP CONSTRAINT "FK_disputes_reviewed_by"
    `);

    await queryRunner.query(`
      ALTER TABLE "disputes"
      DROP CONSTRAINT "FK_disputes_created_by"
    `);

    await queryRunner.query(`
      ALTER TABLE "disputes"
      DROP CONSTRAINT "FK_disputes_escrows"
    `);

    // Drop tables
    await queryRunner.query(`
      DROP TABLE "dispute_messages"
    `);

    await queryRunner.query(`
      DROP TABLE "dispute_evidence"
    `);

    await queryRunner.query(`
      DROP TABLE "disputes"
    `);

    // Drop enum types
    await queryRunner.query(`
      DROP TYPE "public"."evidence_type_enum"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."dispute_resolution_enum"
    `);

    await queryRunner.query(`
      DROP TYPE "public"."dispute_status_enum"
    `);

    // Note: We cannot easily remove a value from an enum type in PostgreSQL
    // The DISPUTED status will remain in the escrow_status_enum
  }
}
