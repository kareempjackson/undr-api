"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddEncryptedColumns1711165982234 = void 0;
class AddEncryptedColumns1711165982234 {
    constructor() {
        this.name = "AddEncryptedColumns1711165982234";
    }
    async up(queryRunner) {
        await queryRunner.query(`
            ALTER TABLE "users" 
            ALTER COLUMN "email" TYPE text, 
            ALTER COLUMN "name" TYPE text,
            ALTER COLUMN "phoneNumber" TYPE text
        `);
        await queryRunner.query(`
            ALTER TABLE "wallets" 
            ALTER COLUMN "balance" TYPE text
        `);
        await queryRunner.query(`
            ALTER TABLE "payments" 
            ALTER COLUMN "amount" TYPE text,
            ALTER COLUMN "description" TYPE text,
            ALTER COLUMN "externalId" TYPE text
        `);
        await queryRunner.query(`
            CREATE EXTENSION IF NOT EXISTS pgcrypto
        `);
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "email_hash" bytea
        `);
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
        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS users_email_hash_idx ON "users" (email_hash);
        `);
    }
    async down(queryRunner) {
        await queryRunner.query(`
            DROP INDEX IF EXISTS users_email_hash_idx;
        `);
        await queryRunner.query(`
            DROP TRIGGER IF EXISTS hash_email_trigger ON "users";
        `);
        await queryRunner.query(`
            DROP FUNCTION IF EXISTS hash_email();
        `);
        await queryRunner.query(`
            ALTER TABLE "users" DROP COLUMN IF EXISTS "email_hash";
        `);
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
exports.AddEncryptedColumns1711165982234 = AddEncryptedColumns1711165982234;
//# sourceMappingURL=1711165982234-AddEncryptedColumns.js.map