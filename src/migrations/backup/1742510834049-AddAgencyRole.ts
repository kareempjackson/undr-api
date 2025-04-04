import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAgencyRole1742530401040 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create a new enum type with the AGENCY role
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'CREATOR', 'FAN', 'AGENCY')`
    );

    // First, drop the default constraint
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`
    );

    // Update the column to use the new enum type
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"`
    );

    // Re-add the default value
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'FAN'`
    );

    // Drop the old enum type
    await queryRunner.query(`DROP TYPE "public"."users_role_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert the changes by creating a new enum without the AGENCY role
    await queryRunner.query(
      `ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'CREATOR', 'FAN')`
    );

    // Update any AGENCY users to FAN before changing the type
    await queryRunner.query(
      `UPDATE "users" SET "role" = 'FAN' WHERE "role" = 'AGENCY'`
    );

    // First, drop the default constraint
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`
    );

    // Update the column to use the new enum type
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"`
    );

    // Re-add the default value
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'FAN'`
    );

    // Drop the old enum type
    await queryRunner.query(`DROP TYPE "public"."users_role_enum_old"`);
  }
}
