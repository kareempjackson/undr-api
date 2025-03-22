"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAliasFields1711167523452 = void 0;
class AddAliasFields1711167523452 {
    constructor() {
        this.name = "AddAliasFields1711167523452";
    }
    async up(queryRunner) {
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN "alias" varchar(255) UNIQUE
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_users_alias" ON "users" ("alias")
        `);
        await queryRunner.query(`
            ALTER TABLE "payments" 
            ADD COLUMN "fromAlias" text NOT NULL DEFAULT 'anonymous',
            ADD COLUMN "toAlias" text NOT NULL DEFAULT 'anonymous',
            ADD COLUMN "metadata" jsonb
        `);
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
    async down(queryRunner) {
        await queryRunner.query(`
            ALTER TABLE "payments" 
            DROP COLUMN IF EXISTS "metadata",
            DROP COLUMN IF EXISTS "fromAlias",
            DROP COLUMN IF EXISTS "toAlias"
        `);
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_users_alias"
        `);
        await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN IF EXISTS "alias"
        `);
    }
}
exports.AddAliasFields1711167523452 = AddAliasFields1711167523452;
//# sourceMappingURL=1711167523452-AddAliasFields.js.map