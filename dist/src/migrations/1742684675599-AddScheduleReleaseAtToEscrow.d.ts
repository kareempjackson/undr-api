import { MigrationInterface, QueryRunner } from "typeorm";
export declare class AddScheduleReleaseAtToEscrow1742684675599 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
