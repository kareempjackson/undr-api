import { MigrationInterface, QueryRunner } from "typeorm";

export class AddScheduleReleaseAtColumn1742684800000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check if the column exists before adding it
    const hasColumn = await queryRunner.hasColumn(
      "escrows",
      "scheduleReleaseAt"
    );
    if (!hasColumn) {
      await queryRunner.query(
        `ALTER TABLE "escrows" ADD "scheduleReleaseAt" TIMESTAMP`
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check if the column exists before dropping it
    const hasColumn = await queryRunner.hasColumn(
      "escrows",
      "scheduleReleaseAt"
    );
    if (hasColumn) {
      await queryRunner.query(
        `ALTER TABLE "escrows" DROP COLUMN "scheduleReleaseAt"`
      );
    }
  }
}
