"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddAgencyRole1742530401040 = void 0;
class AddAgencyRole1742530401040 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'CREATOR', 'FAN', 'AGENCY')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'FAN'`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum_old"`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'CREATOR', 'FAN')`);
        await queryRunner.query(`UPDATE "users" SET "role" = 'FAN' WHERE "role" = 'AGENCY'`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'FAN'`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum_old"`);
    }
}
exports.AddAgencyRole1742530401040 = AddAgencyRole1742530401040;
//# sourceMappingURL=1742530401040-AddAgencyRole.js.map