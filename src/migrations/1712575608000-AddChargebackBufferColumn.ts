import { MigrationInterface, QueryRunner } from "typeorm";

export class AddChargebackBufferColumn1712575608000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log("Running migration: AddChargebackBufferColumn");

    // Check if column already exists to make migration idempotent
    const columnExists = await queryRunner.hasColumn(
      "wallets",
      "chargebackBuffer"
    );

    if (!columnExists) {
      console.log("Adding chargebackBuffer column to wallets table");
      await queryRunner.query(`
                ALTER TABLE "wallets" 
                ADD COLUMN IF NOT EXISTS "chargebackBuffer" boolean NOT NULL DEFAULT false
            `);
      console.log("Successfully added chargebackBuffer column");
    } else {
      console.log("Column chargebackBuffer already exists, skipping migration");
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log("Rolling back migration: AddChargebackBufferColumn");
    await queryRunner.query(`
            ALTER TABLE "wallets" 
            DROP COLUMN IF EXISTS "chargebackBuffer"
        `);
    console.log("Successfully dropped chargebackBuffer column");
  }
}
