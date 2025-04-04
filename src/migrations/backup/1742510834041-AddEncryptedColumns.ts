import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEncryptedColumns1711165982234 implements MigrationInterface {
  name = "AddEncryptedColumns1711165982234";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Modify columns to use text type for encrypted data

    // User columns
    await queryRunner.query(`
            ALTER TABLE "users" 
            ALTER COLUMN "email" TYPE text, 
            ALTER COLUMN "name" TYPE text,
            ALTER COLUMN "phoneNumber" TYPE text
        `);

    // Wallet columns
    await queryRunner.query(`
            ALTER TABLE "wallets" 
            ALTER COLUMN "balance" TYPE text
        `);

    // Payment columns
    await queryRunner.query(`
            ALTER TABLE "payments" 
            ALTER COLUMN "amount" TYPE text,
            ALTER COLUMN "description" TYPE text,
            ALTER COLUMN "externalId" TYPE text
        `);

    // Add indices for encrypted columns to maintain performance
    await queryRunner.query(`
            CREATE EXTENSION IF NOT EXISTS pgcrypto
        `);

    // Since email is the most commonly queried encrypted field,
    // we'll add a unique hash index
    await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "email_hash" bytea
        `);

    // Create trigger to maintain email_hash on insert/update
    await queryRunner.query(`
            CREATE OR REPLACE FUNCTION hash_email() RETURNS TRIGGER AS $$
            BEGIN
                IF NEW.email IS NOT NULL THEN
                    NEW.email_hash := digest(NEW.email, 'sha256');
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

    await queryRunner.query(`
            DROP TRIGGER IF EXISTS hash_email_trigger ON "users";
            CREATE TRIGGER hash_email_trigger
            BEFORE INSERT OR UPDATE ON "users"
            FOR EACH ROW EXECUTE FUNCTION hash_email();
        `);

    // Create unique index on email_hash
    await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS users_email_hash_idx ON "users" (email_hash);
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Roll back unique index
    await queryRunner.query(`
            DROP INDEX IF EXISTS users_email_hash_idx;
        `);

    // Drop the trigger
    await queryRunner.query(`
            DROP TRIGGER IF EXISTS hash_email_trigger ON "users";
        `);

    // Drop the function
    await queryRunner.query(`
            DROP FUNCTION IF EXISTS hash_email();
        `);

    // Drop the email_hash column
    await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN IF EXISTS "email_hash";
        `);

    // Revert column types
    await queryRunner.query(`
            ALTER TABLE "users" 
            ALTER COLUMN "email" TYPE varchar(255), 
            ALTER COLUMN "name" TYPE varchar(255),
            ALTER COLUMN "phoneNumber" TYPE varchar(255)
        `);

    await queryRunner.query(`
            ALTER TABLE "wallets" 
            ALTER COLUMN "balance" TYPE numeric(10,2)
        `);

    await queryRunner.query(`
            ALTER TABLE "payments" 
            ALTER COLUMN "amount" TYPE numeric(10,2),
            ALTER COLUMN "description" TYPE varchar(255),
            ALTER COLUMN "externalId" TYPE varchar(255)
        `);
  }
}
