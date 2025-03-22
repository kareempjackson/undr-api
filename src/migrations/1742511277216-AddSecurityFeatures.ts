import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSecurityFeatures1742511277216 implements MigrationInterface {
    name = 'AddSecurityFeatures1742511277216'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."risk_assessments_risklevel_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')`);
        await queryRunner.query(`CREATE TABLE "risk_assessments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "paymentId" uuid, "userId" uuid NOT NULL, "riskLevel" "public"."risk_assessments_risklevel_enum" NOT NULL DEFAULT 'LOW', "riskFlags" jsonb NOT NULL DEFAULT '[]', "riskScore" numeric(5,2) NOT NULL DEFAULT '0', "riskDetails" text, "deviceInfo" jsonb, "ipAddress" character varying, "location" character varying, "requires3ds" boolean NOT NULL DEFAULT false, "requiresMfa" boolean NOT NULL DEFAULT false, "blocked" boolean NOT NULL DEFAULT false, "reviewRequired" boolean NOT NULL DEFAULT true, "reviewedByUserId" uuid, "reviewNotes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "reviewedAt" TIMESTAMP, CONSTRAINT "PK_2717ff3f294d30390a712653d63" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."escrow_milestones_status_enum" AS ENUM('PENDING', 'COMPLETED', 'DISPUTED')`);
        await queryRunner.query(`CREATE TABLE "escrow_milestones" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "escrowId" character varying NOT NULL, "amount" numeric(10,2) NOT NULL, "description" text NOT NULL, "status" "public"."escrow_milestones_status_enum" NOT NULL DEFAULT 'PENDING', "sequence" integer NOT NULL, "completedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_fa6bd455d3bec9a08c0fa066743" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."escrows_status_enum" AS ENUM('PENDING', 'FUNDED', 'RELEASED', 'REFUNDED', 'DISPUTED', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "escrows" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "totalAmount" numeric(10,2) NOT NULL, "status" "public"."escrows_status_enum" NOT NULL DEFAULT 'PENDING', "title" text NOT NULL, "description" text, "expiresAt" TIMESTAMP NOT NULL, "buyerId" uuid NOT NULL, "sellerId" uuid NOT NULL, "paymentId" uuid, "terms" jsonb, "evidenceFiles" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "completedAt" TIMESTAMP, CONSTRAINT "PK_9cd10ae5b52350c3a20d124f5d3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."disputes_status_enum" AS ENUM('OPEN', 'UNDER_REVIEW', 'RESOLVED_FOR_MERCHANT', 'RESOLVED_FOR_CUSTOMER', 'ESCALATED', 'CLOSED')`);
        await queryRunner.query(`CREATE TYPE "public"."disputes_reason_enum" AS ENUM('PRODUCT_NOT_RECEIVED', 'PRODUCT_NOT_AS_DESCRIBED', 'UNAUTHORIZED_TRANSACTION', 'DUPLICATE_TRANSACTION', 'SUBSCRIPTION_CANCELED', 'OTHER')`);
        await queryRunner.query(`CREATE TABLE "disputes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "paymentId" uuid NOT NULL, "filedByUserId" uuid NOT NULL, "status" "public"."disputes_status_enum" NOT NULL DEFAULT 'OPEN', "reason" "public"."disputes_reason_enum" NOT NULL, "description" text NOT NULL, "evidenceFiles" jsonb, "responsePacket" jsonb, "resolutionNotes" text, "resolvedByUserId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "resolvedAt" TIMESTAMP, CONSTRAINT "PK_3c97580d01c1a4b0b345c42a107" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."payments_threedsstatus_enum" AS ENUM('NOT_REQUIRED', 'REQUIRED', 'AUTHENTICATED', 'FAILED', 'REJECTED')`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "threeDsStatus" "public"."payments_threedsstatus_enum" DEFAULT 'NOT_REQUIRED'`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "threeDsUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "threeDsResult" jsonb`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "riskScore" numeric(5,2) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "hasDispute" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "isHighRisk" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "ipAddress" character varying`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "deviceInfo" jsonb`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "browserInfo" character varying`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "isInternational" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "invoiceDetails" jsonb`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "receiptData" jsonb`);
        await queryRunner.query(`CREATE TYPE "public"."users_mfamethod_enum" AS ENUM('NONE', 'EMAIL', 'SMS', 'AUTHENTICATOR', 'BIOMETRIC')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "mfaMethod" "public"."users_mfamethod_enum" NOT NULL DEFAULT 'NONE'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "mfaSecret" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "mfaEnabled" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "highSecurityMode" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "trustedDevices" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "loginHistory" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "phoneNumber" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "phoneVerified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TYPE "public"."payments_status_enum" RENAME TO "payments_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."payments_status_enum" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'DISPUTED', 'HELD', 'ESCROW')`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "status" TYPE "public"."payments_status_enum" USING "status"::"text"::"public"."payments_status_enum"`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "risk_assessments" ADD CONSTRAINT "FK_48a6cbf3db98bc76347a8ff4615" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "risk_assessments" ADD CONSTRAINT "FK_4fb7acafe990a5abbf321c534a5" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "risk_assessments" ADD CONSTRAINT "FK_919eee7d7619c2903abe15769f0" FOREIGN KEY ("reviewedByUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "escrows" ADD CONSTRAINT "FK_14acfd5e5f245f13e295f2bc063" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "escrows" ADD CONSTRAINT "FK_2d3fccfd6e0644e8979c7db4228" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "escrows" ADD CONSTRAINT "FK_b3db2d3bb9e54a5d9014630d6b1" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "disputes" ADD CONSTRAINT "FK_ed56a2c08d6e2176e50d985e37c" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "disputes" ADD CONSTRAINT "FK_23f126d4aaaa9d67243895b784b" FOREIGN KEY ("filedByUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "disputes" ADD CONSTRAINT "FK_a2215614b176b851d3e431de9b9" FOREIGN KEY ("resolvedByUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "disputes" DROP CONSTRAINT "FK_a2215614b176b851d3e431de9b9"`);
        await queryRunner.query(`ALTER TABLE "disputes" DROP CONSTRAINT "FK_23f126d4aaaa9d67243895b784b"`);
        await queryRunner.query(`ALTER TABLE "disputes" DROP CONSTRAINT "FK_ed56a2c08d6e2176e50d985e37c"`);
        await queryRunner.query(`ALTER TABLE "escrows" DROP CONSTRAINT "FK_b3db2d3bb9e54a5d9014630d6b1"`);
        await queryRunner.query(`ALTER TABLE "escrows" DROP CONSTRAINT "FK_2d3fccfd6e0644e8979c7db4228"`);
        await queryRunner.query(`ALTER TABLE "escrows" DROP CONSTRAINT "FK_14acfd5e5f245f13e295f2bc063"`);
        await queryRunner.query(`ALTER TABLE "risk_assessments" DROP CONSTRAINT "FK_919eee7d7619c2903abe15769f0"`);
        await queryRunner.query(`ALTER TABLE "risk_assessments" DROP CONSTRAINT "FK_4fb7acafe990a5abbf321c534a5"`);
        await queryRunner.query(`ALTER TABLE "risk_assessments" DROP CONSTRAINT "FK_48a6cbf3db98bc76347a8ff4615"`);
        await queryRunner.query(`CREATE TYPE "public"."payments_status_enum_old" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "status" TYPE "public"."payments_status_enum_old" USING "status"::"text"::"public"."payments_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "status" SET DEFAULT 'PENDING'`);
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."payments_status_enum_old" RENAME TO "payments_status_enum"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phoneVerified"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phoneNumber"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "loginHistory"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "trustedDevices"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "highSecurityMode"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "mfaEnabled"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "mfaSecret"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "mfaMethod"`);
        await queryRunner.query(`DROP TYPE "public"."users_mfamethod_enum"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "receiptData"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "invoiceDetails"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "isInternational"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "browserInfo"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "deviceInfo"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "ipAddress"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "isHighRisk"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "hasDispute"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "riskScore"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "threeDsResult"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "threeDsUrl"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "threeDsStatus"`);
        await queryRunner.query(`DROP TYPE "public"."payments_threedsstatus_enum"`);
        await queryRunner.query(`DROP TABLE "disputes"`);
        await queryRunner.query(`DROP TYPE "public"."disputes_reason_enum"`);
        await queryRunner.query(`DROP TYPE "public"."disputes_status_enum"`);
        await queryRunner.query(`DROP TABLE "escrows"`);
        await queryRunner.query(`DROP TYPE "public"."escrows_status_enum"`);
        await queryRunner.query(`DROP TABLE "escrow_milestones"`);
        await queryRunner.query(`DROP TYPE "public"."escrow_milestones_status_enum"`);
        await queryRunner.query(`DROP TABLE "risk_assessments"`);
        await queryRunner.query(`DROP TYPE "public"."risk_assessments_risklevel_enum"`);
    }

}
