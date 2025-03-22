import { MigrationInterface, QueryRunner } from "typeorm";
export declare class AddEncryptedColumns1711165982234 implements MigrationInterface {
    name: string;
    up(queryRunner: QueryRunner): Promise<void>;
    down(queryRunner: QueryRunner): Promise<void>;
}
