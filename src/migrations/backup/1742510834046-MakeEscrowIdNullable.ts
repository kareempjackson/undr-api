import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeEscrowIdNullable1742520000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // First check if the column exists and if it's not already nullable
    const table = await queryRunner.getTable("disputes");
    const escrowIdColumn = table?.findColumnByName("escrowId");
    const createdByIdColumn = table?.findColumnByName("createdById");

    if (escrowIdColumn && !escrowIdColumn.isNullable) {
      // Make the escrowId column nullable
      await queryRunner.query(
        `ALTER TABLE "disputes" ALTER COLUMN "escrowId" DROP NOT NULL`
      );
      console.log("Made escrowId column nullable in disputes table");
    }

    if (createdByIdColumn && !createdByIdColumn.isNullable) {
      // Make the createdById column nullable
      await queryRunner.query(
        `ALTER TABLE "disputes" ALTER COLUMN "createdById" DROP NOT NULL`
      );
      console.log("Made createdById column nullable in disputes table");
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This is potentially a destructive operation if data with null values exists
    // So we'll just log a warning
    console.log(
      "WARNING: down migration would make columns NOT NULL, which could fail if nulls exist"
    );
    // If you want to make it not nullable again, first ensure all rows have a value
    // await queryRunner.query(`UPDATE "disputes" SET "escrowId" = 'some-fallback-id' WHERE "escrowId" IS NULL`);
    // await queryRunner.query(`ALTER TABLE "disputes" ALTER COLUMN "escrowId" SET NOT NULL`);
  }
}
