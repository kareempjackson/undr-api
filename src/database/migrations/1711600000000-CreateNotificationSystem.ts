import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNotificationSystem1711600000000
  implements MigrationInterface
{
  name = "CreateNotificationSystem1711600000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "public"."notification_type_enum" AS ENUM(
        'escrow_created', 'escrow_funded', 'escrow_completed', 'escrow_released',
        'proof_submitted', 'proof_approved', 'proof_rejected',
        'dispute_created', 'dispute_resolved', 'dispute_evidence', 'dispute_message',
        'payment_received', 'payment_sent',
        'system', 'system_announcement', 'security_alert'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "public"."notification_channel_enum" AS ENUM(
        'in_app', 'email', 'sms', 'push'
      )
    `);

    // Create notification table
    await queryRunner.query(`
      CREATE TABLE "notification" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "type" "public"."notification_type_enum" NOT NULL DEFAULT 'system',
        "title" character varying NOT NULL,
        "message" text NOT NULL,
        "actionUrl" character varying,
        "isRead" boolean NOT NULL DEFAULT false,
        "metadata" jsonb,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification" PRIMARY KEY ("id")
      )
    `);

    // Create indexes on notification table
    await queryRunner.query(`
      CREATE INDEX "IDX_notification_userId" ON "notification" ("userId")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notification_isRead" ON "notification" ("isRead")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_notification_createdAt" ON "notification" ("createdAt")
    `);

    // Create notification_preference table
    await queryRunner.query(`
      CREATE TABLE "notification_preference" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "type" "public"."notification_type_enum" NOT NULL,
        "channel" "public"."notification_channel_enum" NOT NULL,
        "enabled" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_preference" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_notification_preference" UNIQUE ("userId", "type", "channel")
      )
    `);

    // Create indexes on notification_preference table
    await queryRunner.query(`
      CREATE INDEX "IDX_notification_preference_userId" ON "notification_preference" ("userId")
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "notification" 
      ADD CONSTRAINT "FK_notification_user" 
      FOREIGN KEY ("userId") 
      REFERENCES "user"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "notification_preference" 
      ADD CONSTRAINT "FK_notification_preference_user" 
      FOREIGN KEY ("userId") 
      REFERENCES "user"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "notification" 
      DROP CONSTRAINT "FK_notification_user"
    `);

    await queryRunner.query(`
      ALTER TABLE "notification_preference"
      DROP CONSTRAINT "FK_notification_preference_user"
    `);

    // Drop tables
    await queryRunner.query(`DROP TABLE "notification"`);
    await queryRunner.query(`DROP TABLE "notification_preference"`);

    // Drop enum types
    await queryRunner.query(`DROP TYPE "public"."notification_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."notification_channel_enum"`);
  }
}
