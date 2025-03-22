import { MigrationInterface, QueryRunner } from "typeorm";
export declare class UpdateEscrowSystem1711168600000 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
