import { MigrationInterface, QueryRunner } from "typeorm";
export declare class AddAliasFields1711167523452 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
