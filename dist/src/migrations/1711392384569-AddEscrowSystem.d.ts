import { MigrationInterface, QueryRunner } from "typeorm";
export declare class AddEscrowSystem1711392384569 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
