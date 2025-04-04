import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateNotificationSystem1711600000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create notification_type enum
    await queryRunner.query(`
      CREATE TYPE "public"."notification_type_enum" AS ENUM(
        'ESCROW_CREATED', 'ESCROW_FUNDED', 'ESCROW_COMPLETED', 'ESCROW_CANCELLED', 'ESCROW_EXPIRED',
        'MILESTONE_COMPLETED', 'MILESTONE_UPDATED',
        'PROOF_SUBMITTED', 'PROOF_ACCEPTED', 'PROOF_REJECTED',
        'DISPUTE_CREATED', 'DISPUTE_EVIDENCE_ADDED', 'DISPUTE_EVIDENCE_DEADLINE', 'DISPUTE_RESOLUTION_PROPOSED', 'DISPUTE_ADMIN_INTERVENTION', 'DISPUTE_RESOLVED',
        'SYSTEM_ANNOUNCEMENT', 'SECURITY_ALERT'
      )
    `);

    // Create notification_channel enum
    await queryRunner.query(`
      CREATE TYPE "public"."notification_channel_enum" AS ENUM('IN_APP', 'EMAIL', 'PUSH')
    `);

    // Create notifications table
    await queryRunner.query(`
      CREATE TABLE "notifications" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "type" "public"."notification_type_enum" NOT NULL,
        "title" character varying NOT NULL,
        "message" text NOT NULL,
        "data" jsonb NOT NULL DEFAULT '{}',
        "channel" "public"."notification_channel_enum" NOT NULL DEFAULT 'IN_APP',
        "isRead" boolean NOT NULL DEFAULT false,
        "readAt" TIMESTAMP WITH TIME ZONE,
        "targetUrl" character varying,
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
      )
    `);

    // Create index on userId for faster lookups
    await queryRunner.query(`
      CREATE INDEX "IDX_notifications_userId" ON "notifications" ("userId")
    `);

    // Create notification_preferences table
    await queryRunner.query(`
      CREATE TABLE "notification_preferences" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "type" "public"."notification_type_enum" NOT NULL,
        "channel" "public"."notification_channel_enum" NOT NULL,
        "enabled" boolean NOT NULL DEFAULT true,
        "settings" jsonb NOT NULL DEFAULT '{}',
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_notification_preferences" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_notification_preferences_user_type_channel" UNIQUE ("userId", "type", "channel")
      )
    `);

    // Create index on userId for faster lookups
    await queryRunner.query(`
      CREATE INDEX "IDX_notification_preferences_userId" ON "notification_preferences" ("userId")
    `);

    // Add foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "notifications" 
      ADD CONSTRAINT "FK_notifications_userId" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "notification_preferences" 
      ADD CONSTRAINT "FK_notification_preferences_userId" 
      FOREIGN KEY ("userId") REFERENCES "users"("id") 
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "notifications" DROP CONSTRAINT "FK_notifications_userId"
    `);

    await queryRunner.query(`
      ALTER TABLE "notification_preferences" DROP CONSTRAINT "FK_notification_preferences_userId"
    `);

    // Drop tables
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TABLE "notification_preferences"`);

    // Drop enums
    await queryRunner.query(`DROP TYPE "public"."notification_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."notification_channel_enum"`);
  }
}
