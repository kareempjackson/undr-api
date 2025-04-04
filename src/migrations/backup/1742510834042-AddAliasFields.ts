import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAliasFields1711167523452 implements MigrationInterface {
  name = "AddAliasFields1711167523452";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add alias column to users table
    await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN "alias" varchar(255) UNIQUE
        `);

    // Create index on alias column for faster lookups
    await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_users_alias" ON "users" ("alias")
        `);

    // Add alias columns and metadata to payments table
    await queryRunner.query(`
            ALTER TABLE "payments" 
            ADD COLUMN "fromAlias" text NOT NULL DEFAULT 'anonymous',
            ADD COLUMN "toAlias" text NOT NULL DEFAULT 'anonymous',
            ADD COLUMN "metadata" jsonb
        `);

    // Generate initial aliases for existing users if any
    await queryRunner.query(`
            UPDATE "users"
            SET "alias" = CASE 
                WHEN "role" = 'CREATOR' THEN CONCAT('creator_', SUBSTR(MD5(RANDOM()::text), 1, 8))
                WHEN "role" = 'FAN' THEN CONCAT('fan_', SUBSTR(MD5(RANDOM()::text), 1, 8))
                ELSE CONCAT('user_', SUBSTR(MD5(RANDOM()::text), 1, 8))
            END
            WHERE "alias" IS NULL
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove metadata and alias columns from payments table
    await queryRunner.query(`
            ALTER TABLE "payments" 
            DROP COLUMN IF EXISTS "metadata",
            DROP COLUMN IF EXISTS "fromAlias",
            DROP COLUMN IF EXISTS "toAlias"
        `);

    // Remove index on alias column
    await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_users_alias"
        `);

    // Remove alias column from users table
    await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN IF EXISTS "alias"
        `);
  }
}
