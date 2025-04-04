import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1743008348720 implements MigrationInterface {
  name = "InitialMigration1743008348720";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create extension for UUID generation
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Create all enum types first
    await queryRunner.query(
      `CREATE TYPE "public"."users_role_enum" AS ENUM('ADMIN', 'CREATOR', 'FAN', 'AGENCY')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_status_enum" AS ENUM('ACTIVE', 'PENDING', 'SUSPENDED', 'DELETED')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."users_mfamethod_enum" AS ENUM('NONE', 'EMAIL', 'SMS', 'AUTHENTICATOR', 'BIOMETRIC')`
    );

    await queryRunner.query(
      `CREATE TYPE "public"."payments_status_enum" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'DISPUTED', 'HELD', 'ESCROW')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_method_enum" AS ENUM('WALLET', 'CREDIT_CARD', 'CRYPTO_BTC', 'CRYPTO_ETH', 'CRYPTO_USDT')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."payments_threedsstatus_enum" AS ENUM('NOT_REQUIRED', 'REQUIRED', 'AUTHENTICATED', 'FAILED', 'REJECTED')`
    );

    await queryRunner.query(
      `CREATE TYPE "public"."deposits_status_enum" AS ENUM('PENDING', 'COMPLETED', 'FAILED')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."deposits_method_enum" AS ENUM('WALLET', 'CREDIT_CARD', 'CRYPTO_BTC', 'CRYPTO_ETH', 'CRYPTO_USDT')`
    );

    await queryRunner.query(
      `CREATE TYPE "public"."withdrawals_status_enum" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'REJECTED')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."withdrawals_method_enum" AS ENUM('WALLET', 'CREDIT_CARD', 'CRYPTO_BTC', 'CRYPTO_ETH', 'CRYPTO_USDT')`
    );

    await queryRunner.query(
      `CREATE TYPE "public"."risk_assessments_risklevel_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')`
    );

    await queryRunner.query(
      `CREATE TYPE "public"."escrows_status_enum" AS ENUM('PENDING', 'FUNDED', 'RELEASED', 'REFUNDED', 'DISPUTED', 'COMPLETED', 'CANCELLED')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."escrow_milestones_status_enum" AS ENUM('PENDING', 'COMPLETED', 'DISPUTED')`
    );

    await queryRunner.query(
      `CREATE TYPE "public"."disputes_status_enum" AS ENUM('EVIDENCE_SUBMISSION', 'UNDER_REVIEW', 'MUTUALLY_RESOLVED', 'RESOLVED_BY_ADMIN', 'CLOSED', 'EXPIRED', 'OPEN', 'RESOLVED_FOR_CUSTOMER', 'RESOLVED_FOR_MERCHANT', 'ESCALATED')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."disputes_resolution_enum" AS ENUM('BUYER_REFUND', 'SELLER_RECEIVE', 'SPLIT', 'CUSTOM')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."dispute_evidence_type_enum" AS ENUM('TEXT', 'IMAGE', 'DOCUMENT', 'VIDEO', 'OTHER')`
    );

    await queryRunner.query(
      `CREATE TYPE "public"."delivery_proofs_type_enum" AS ENUM('IMAGE', 'DOCUMENT', 'VIDEO', 'LINK', 'TEXT')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."delivery_proofs_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED')`
    );

    await queryRunner.query(
      `CREATE TYPE "public"."transaction_logs_type_enum" AS ENUM('ESCROW_CREATED', 'ESCROW_FUNDED', 'ESCROW_PROOF_SUBMITTED', 'ESCROW_PROOF_REVIEWED', 'ESCROW_COMPLETED', 'ESCROW_CANCELLED', 'ESCROW_REFUNDED', 'ESCROW_DISPUTED', 'ESCROW_TERMS_UPDATED', 'MILESTONE_UPDATED')`
    );

    await queryRunner.query(
      `CREATE TYPE "public"."notifications_type_enum" AS ENUM('escrow_created', 'escrow_funded', 'escrow_completed', 'escrow_released', 'MILESTONE_COMPLETED', 'MILESTONE_UPDATED', 'proof_submitted', 'proof_approved', 'proof_rejected', 'dispute_created', 'dispute_resolved', 'dispute_evidence', 'dispute_message', 'payment_received', 'payment_sent', 'system', 'SYSTEM_ANNOUNCEMENT', 'SECURITY_ALERT')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notifications_channel_enum" AS ENUM('IN_APP', 'EMAIL', 'PUSH')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notification_preferences_type_enum" AS ENUM('escrow_created', 'escrow_funded', 'escrow_completed', 'escrow_released', 'MILESTONE_COMPLETED', 'MILESTONE_UPDATED', 'proof_submitted', 'proof_approved', 'proof_rejected', 'dispute_created', 'dispute_resolved', 'dispute_evidence', 'dispute_message', 'payment_received', 'payment_sent', 'system', 'SYSTEM_ANNOUNCEMENT', 'SECURITY_ALERT')`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."notification_preferences_channel_enum" AS ENUM('in_app', 'email', 'sms', 'push')`
    );

    // Create tables
    await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "name" character varying,
                "alias" character varying,
                "phoneNumber" character varying,
                "role" "public"."users_role_enum" NOT NULL DEFAULT 'FAN',
                "status" "public"."users_status_enum" NOT NULL DEFAULT 'PENDING',
                "profileImage" character varying,
                "bio" character varying,
                "location" character varying,
                "emailVerified" boolean NOT NULL DEFAULT false,
                "featured" boolean NOT NULL DEFAULT false,
                "mfaMethod" "public"."users_mfamethod_enum" NOT NULL DEFAULT 'NONE',
                "mfaSecret" character varying,
                "mfaEnabled" boolean NOT NULL DEFAULT false,
                "highSecurityMode" boolean NOT NULL DEFAULT false,
                "trustedDevices" jsonb NOT NULL DEFAULT '[]',
                "loginHistory" jsonb NOT NULL DEFAULT '[]',
                "phoneVerified" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "UQ_f002c336d3299ee4eba00196902" UNIQUE ("alias"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "wallets" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "balance" numeric(10,2) NOT NULL DEFAULT '0',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" uuid NOT NULL,
                CONSTRAINT "REL_2ecdb33f23e9a6fc392025c0b9" UNIQUE ("userId"),
                CONSTRAINT "PK_8402e5df5a30a229380e83e4f7e" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "payments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "amount" numeric(10,2) NOT NULL,
                "status" "public"."payments_status_enum" NOT NULL DEFAULT 'PENDING',
                "method" "public"."payments_method_enum" NOT NULL,
                "description" character varying,
                "externalId" character varying,
                "fromAlias" character varying NOT NULL,
                "toAlias" character varying NOT NULL,
                "metadata" jsonb,
                "threeDsStatus" "public"."payments_threedsstatus_enum" DEFAULT 'NOT_REQUIRED',
                "threeDsUrl" character varying,
                "threeDsResult" jsonb,
                "riskScore" numeric(5,2) NOT NULL DEFAULT '0',
                "hasDispute" boolean NOT NULL DEFAULT false,
                "isHighRisk" boolean NOT NULL DEFAULT false,
                "ipAddress" character varying,
                "deviceInfo" jsonb,
                "browserInfo" character varying,
                "isInternational" boolean NOT NULL DEFAULT false,
                "invoiceDetails" jsonb,
                "receiptData" jsonb,
                "fromUserId" uuid NOT NULL,
                "toUserId" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "deposits" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "amount" numeric(10,2) NOT NULL,
                "status" "public"."deposits_status_enum" NOT NULL DEFAULT 'PENDING',
                "method" "public"."deposits_method_enum" NOT NULL,
                "transactionId" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" uuid NOT NULL,
                CONSTRAINT "PK_f49ba0cd446eaf7abb4953385d9" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "withdrawals" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "amount" numeric(10,2) NOT NULL,
                "status" "public"."withdrawals_status_enum" NOT NULL DEFAULT 'PENDING',
                "method" "public"."withdrawals_method_enum" NOT NULL,
                "payoutDetails" jsonb,
                "transactionId" character varying,
                "rejectionReason" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" uuid NOT NULL,
                CONSTRAINT "PK_9871ec481baa7755f8bd8b7c7e9" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "risk_assessments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "paymentId" uuid,
                "userId" uuid NOT NULL,
                "riskLevel" "public"."risk_assessments_risklevel_enum" NOT NULL DEFAULT 'LOW',
                "riskFlags" jsonb NOT NULL DEFAULT '[]',
                "riskScore" numeric(5,2) NOT NULL DEFAULT '0',
                "riskDetails" text,
                "deviceInfo" jsonb,
                "ipAddress" character varying,
                "location" character varying,
                "requires3ds" boolean NOT NULL DEFAULT false,
                "requiresMfa" boolean NOT NULL DEFAULT false,
                "blocked" boolean NOT NULL DEFAULT false,
                "reviewRequired" boolean NOT NULL DEFAULT true,
                "reviewedByUserId" uuid,
                "reviewNotes" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "reviewedAt" TIMESTAMP,
                CONSTRAINT "PK_2717ff3f294d30390a712653d63" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "escrows" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "totalAmount" numeric(10,2) NOT NULL,
                "status" "public"."escrows_status_enum" NOT NULL DEFAULT 'PENDING',
                "title" text NOT NULL,
                "description" text,
                "expiresAt" TIMESTAMP NOT NULL,
                "buyerId" uuid NOT NULL,
                "sellerId" uuid NOT NULL,
                "paymentId" uuid,
                "terms" jsonb,
                "evidenceFiles" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "completedAt" TIMESTAMP,
                "scheduleReleaseAt" TIMESTAMP,
                CONSTRAINT "PK_9cd10ae5b52350c3a20d124f5d3" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "escrow_milestones" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "escrowId" uuid NOT NULL,
                "amount" numeric(10,2) NOT NULL,
                "description" text NOT NULL,
                "status" "public"."escrow_milestones_status_enum" NOT NULL DEFAULT 'PENDING',
                "sequence" integer NOT NULL,
                "completedAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_fa6bd455d3bec9a08c0fa066743" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "disputes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "escrowId" uuid NOT NULL,
                "createdById" uuid NOT NULL,
                "reviewedById" uuid,
                "paymentId" uuid,
                "filedByUserId" uuid,
                "resolvedByUserId" uuid,
                "reason" character varying NOT NULL,
                "details" jsonb NOT NULL DEFAULT '{}',
                "status" "public"."disputes_status_enum" NOT NULL DEFAULT 'EVIDENCE_SUBMISSION',
                "resolution" "public"."disputes_resolution_enum",
                "description" text,
                "evidenceFiles" jsonb,
                "responsePacket" jsonb,
                "resolutionNotes" text,
                "evidenceDeadline" TIMESTAMP WITH TIME ZONE,
                "resolvedAt" TIMESTAMP WITH TIME ZONE,
                "buyerAmount" numeric,
                "sellerAmount" numeric,
                "metadata" jsonb NOT NULL DEFAULT '{}',
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_3c97580d01c1a4b0b345c42a107" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "dispute_evidence" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "disputeId" uuid NOT NULL,
                "submittedById" uuid NOT NULL,
                "type" "public"."dispute_evidence_type_enum" NOT NULL,
                "description" text NOT NULL,
                "files" jsonb NOT NULL DEFAULT '[]',
                "metadata" jsonb NOT NULL DEFAULT '{}',
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_dispute_evidence" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "dispute_messages" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "disputeId" uuid NOT NULL,
                "senderId" uuid NOT NULL,
                "message" text NOT NULL,
                "isSystemMessage" boolean NOT NULL DEFAULT false,
                "metadata" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_dispute_messages" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "delivery_proofs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "escrowId" uuid NOT NULL,
                "type" "public"."delivery_proofs_type_enum" NOT NULL,
                "description" text,
                "files" jsonb NOT NULL,
                "status" "public"."delivery_proofs_status_enum" NOT NULL DEFAULT 'PENDING',
                "rejectionReason" text,
                "submittedById" uuid NOT NULL,
                "reviewedById" uuid,
                "reviewedAt" TIMESTAMP,
                "metadata" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_delivery_proofs" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "transaction_logs" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "type" "public"."transaction_logs_type_enum" NOT NULL,
                "userId" uuid,
                "entityId" uuid,
                "entityType" text NOT NULL,
                "data" jsonb NOT NULL,
                "ipAddress" inet,
                "userAgent" text,
                "metadata" jsonb,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_transaction_logs" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "magic_links" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "token" character varying NOT NULL,
                "expiresAt" TIMESTAMP NOT NULL,
                "used" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "userId" uuid NOT NULL,
                CONSTRAINT "PK_6c609d48037f164e7ae5b744b18" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "notifications" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "type" "public"."notifications_type_enum" NOT NULL DEFAULT 'system',
                "title" character varying NOT NULL,
                "message" text NOT NULL,
                "data" jsonb NOT NULL DEFAULT '{}',
                "channel" "public"."notifications_channel_enum" NOT NULL DEFAULT 'IN_APP',
                "isRead" boolean NOT NULL DEFAULT false,
                "readAt" TIMESTAMP WITH TIME ZONE,
                "targetUrl" character varying,
                "actionUrl" character varying,
                "metadata" jsonb,
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_notifications" PRIMARY KEY ("id")
            )
        `);

    await queryRunner.query(`
            CREATE TABLE "notification_preferences" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "userId" uuid NOT NULL,
                "type" "public"."notification_preferences_type_enum" NOT NULL,
                "channel" "public"."notification_preferences_channel_enum" NOT NULL,
                "enabled" boolean NOT NULL DEFAULT true,
                "settings" jsonb NOT NULL DEFAULT '{}',
                "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_notification_preferences" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_5e498be60b9875dcd31c2c53d92" UNIQUE ("userId", "type", "channel")
            )
        `);

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "IDX_users_alias" ON "users" ("alias")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_escrows_buyer" ON "escrows" ("buyerId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_escrows_seller" ON "escrows" ("sellerId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_escrows_status" ON "escrows" ("status")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_escrow_milestones_escrow" ON "escrow_milestones" ("escrowId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_disputes_escrow_id" ON "disputes" ("escrowId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_disputes_created_by" ON "disputes" ("createdById")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_disputes_status" ON "disputes" ("status")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dispute_evidence_dispute_id" ON "dispute_evidence" ("disputeId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_dispute_messages_dispute_id" ON "dispute_messages" ("disputeId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_delivery_proofs_escrow" ON "delivery_proofs" ("escrowId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transaction_logs_user" ON "transaction_logs" ("userId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transaction_logs_entity" ON "transaction_logs" ("entityId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_transaction_logs_type" ON "transaction_logs" ("type")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_userId" ON "notifications" ("userId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notification_preferences_userId" ON "notification_preferences" ("userId")`
    );

    // Add foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "wallets" ADD CONSTRAINT "FK_2ecdb33f23e9a6fc392025c0b97" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_e70879230925c0b8d7c0148ea42" FOREIGN KEY ("fromUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "payments" ADD CONSTRAINT "FK_8b22c286a7aa80a74ab47db1c36" FOREIGN KEY ("toUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "deposits" ADD CONSTRAINT "FK_968bcd26d29022f95d20bb70e21" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "withdrawals" ADD CONSTRAINT "FK_79a3949e02a4652fb2b2a0ccd4e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "magic_links" ADD CONSTRAINT "FK_1c64b8995a08697016868c80186" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `ALTER TABLE "risk_assessments" ADD CONSTRAINT "FK_48a6cbf3db98bc76347a8ff4615" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "risk_assessments" ADD CONSTRAINT "FK_4fb7acafe990a5abbf321c534a5" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "risk_assessments" ADD CONSTRAINT "FK_919eee7d7619c2903abe15769f0" FOREIGN KEY ("reviewedByUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `ALTER TABLE "escrows" ADD CONSTRAINT "FK_14acfd5e5f245f13e295f2bc063" FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "escrows" ADD CONSTRAINT "FK_2d3fccfd6e0644e8979c7db4228" FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "escrows" ADD CONSTRAINT "FK_b3db2d3bb9e54a5d9014630d6b1" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `ALTER TABLE "escrow_milestones" ADD CONSTRAINT "FK_escrow_milestones_escrow" FOREIGN KEY ("escrowId") REFERENCES "escrows"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `ALTER TABLE "disputes" ADD CONSTRAINT "FK_05cc0a36ac22b4dc8a82211d2ee" FOREIGN KEY ("escrowId") REFERENCES "escrows"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "disputes" ADD CONSTRAINT "FK_e7d2dcb550adea002ab6b942f98" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "disputes" ADD CONSTRAINT "FK_7edd330195a70d1f09def673b3d" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "disputes" ADD CONSTRAINT "FK_ed56a2c08d6e2176e50d985e37c" FOREIGN KEY ("paymentId") REFERENCES "payments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `ALTER TABLE "dispute_evidence" ADD CONSTRAINT "FK_741a5a7010d0c03f8122d6d61b2" FOREIGN KEY ("disputeId") REFERENCES "disputes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "dispute_evidence" ADD CONSTRAINT "FK_99edc6603e7617191e7e4c1122d" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `ALTER TABLE "dispute_messages" ADD CONSTRAINT "FK_288e9a3fe13cfe14abe9824e9ce" FOREIGN KEY ("disputeId") REFERENCES "disputes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "dispute_messages" ADD CONSTRAINT "FK_e154dd9c8d78610a275b5c72536" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `ALTER TABLE "delivery_proofs" ADD CONSTRAINT "FK_0341b409eb4f03d62e20f746678" FOREIGN KEY ("escrowId") REFERENCES "escrows"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "delivery_proofs" ADD CONSTRAINT "FK_fa1286ccaa70a454f6554fc39ce" FOREIGN KEY ("submittedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "delivery_proofs" ADD CONSTRAINT "FK_4ee9828586d6690560bd9e5df69" FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `ALTER TABLE "transaction_logs" ADD CONSTRAINT "FK_df5c77db6fc7d0d09fac8dfe7b9" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `ALTER TABLE "notifications" ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );

    await queryRunner.query(
      `ALTER TABLE "notification_preferences" ADD CONSTRAINT "FK_b70c44e8b00757584a393225593" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop all foreign keys first
    await queryRunner.query(
      `ALTER TABLE "notification_preferences" DROP CONSTRAINT "FK_b70c44e8b00757584a393225593"`
    );
    await queryRunner.query(
      `ALTER TABLE "notifications" DROP CONSTRAINT "FK_692a909ee0fa9383e7859f9b406"`
    );
    await queryRunner.query(
      `ALTER TABLE "transaction_logs" DROP CONSTRAINT "FK_df5c77db6fc7d0d09fac8dfe7b9"`
    );
    await queryRunner.query(
      `ALTER TABLE "delivery_proofs" DROP CONSTRAINT "FK_4ee9828586d6690560bd9e5df69"`
    );
    await queryRunner.query(
      `ALTER TABLE "delivery_proofs" DROP CONSTRAINT "FK_fa1286ccaa70a454f6554fc39ce"`
    );
    await queryRunner.query(
      `ALTER TABLE "delivery_proofs" DROP CONSTRAINT "FK_0341b409eb4f03d62e20f746678"`
    );
    await queryRunner.query(
      `ALTER TABLE "dispute_messages" DROP CONSTRAINT "FK_e154dd9c8d78610a275b5c72536"`
    );
    await queryRunner.query(
      `ALTER TABLE "dispute_messages" DROP CONSTRAINT "FK_288e9a3fe13cfe14abe9824e9ce"`
    );
    await queryRunner.query(
      `ALTER TABLE "dispute_evidence" DROP CONSTRAINT "FK_99edc6603e7617191e7e4c1122d"`
    );
    await queryRunner.query(
      `ALTER TABLE "dispute_evidence" DROP CONSTRAINT "FK_741a5a7010d0c03f8122d6d61b2"`
    );
    await queryRunner.query(
      `ALTER TABLE "disputes" DROP CONSTRAINT "FK_ed56a2c08d6e2176e50d985e37c"`
    );
    await queryRunner.query(
      `ALTER TABLE "disputes" DROP CONSTRAINT "FK_7edd330195a70d1f09def673b3d"`
    );
    await queryRunner.query(
      `ALTER TABLE "disputes" DROP CONSTRAINT "FK_e7d2dcb550adea002ab6b942f98"`
    );
    await queryRunner.query(
      `ALTER TABLE "disputes" DROP CONSTRAINT "FK_05cc0a36ac22b4dc8a82211d2ee"`
    );
    await queryRunner.query(
      `ALTER TABLE "escrow_milestones" DROP CONSTRAINT "FK_escrow_milestones_escrow"`
    );
    await queryRunner.query(
      `ALTER TABLE "escrows" DROP CONSTRAINT "FK_b3db2d3bb9e54a5d9014630d6b1"`
    );
    await queryRunner.query(
      `ALTER TABLE "escrows" DROP CONSTRAINT "FK_2d3fccfd6e0644e8979c7db4228"`
    );
    await queryRunner.query(
      `ALTER TABLE "escrows" DROP CONSTRAINT "FK_14acfd5e5f245f13e295f2bc063"`
    );
    await queryRunner.query(
      `ALTER TABLE "risk_assessments" DROP CONSTRAINT "FK_919eee7d7619c2903abe15769f0"`
    );
    await queryRunner.query(
      `ALTER TABLE "risk_assessments" DROP CONSTRAINT "FK_4fb7acafe990a5abbf321c534a5"`
    );
    await queryRunner.query(
      `ALTER TABLE "risk_assessments" DROP CONSTRAINT "FK_48a6cbf3db98bc76347a8ff4615"`
    );
    await queryRunner.query(
      `ALTER TABLE "magic_links" DROP CONSTRAINT "FK_1c64b8995a08697016868c80186"`
    );
    await queryRunner.query(
      `ALTER TABLE "withdrawals" DROP CONSTRAINT "FK_79a3949e02a4652fb2b2a0ccd4e"`
    );
    await queryRunner.query(
      `ALTER TABLE "deposits" DROP CONSTRAINT "FK_968bcd26d29022f95d20bb70e21"`
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_8b22c286a7aa80a74ab47db1c36"`
    );
    await queryRunner.query(
      `ALTER TABLE "payments" DROP CONSTRAINT "FK_e70879230925c0b8d7c0148ea42"`
    );
    await queryRunner.query(
      `ALTER TABLE "wallets" DROP CONSTRAINT "FK_2ecdb33f23e9a6fc392025c0b97"`
    );

    // Drop indexes
    await queryRunner.query(
      `DROP INDEX "public"."IDX_notification_preferences_userId"`
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_notifications_userId"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_transaction_logs_type"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_transaction_logs_entity"`
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_transaction_logs_user"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_delivery_proofs_escrow"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dispute_messages_dispute_id"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_dispute_evidence_dispute_id"`
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_disputes_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_disputes_created_by"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_disputes_escrow_id"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_escrow_milestones_escrow"`
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_escrows_status"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_escrows_seller"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_escrows_buyer"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_users_alias"`);

    // Drop tables
    await queryRunner.query(`DROP TABLE "notification_preferences"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
    await queryRunner.query(`DROP TABLE "magic_links"`);
    await queryRunner.query(`DROP TABLE "transaction_logs"`);
    await queryRunner.query(`DROP TABLE "delivery_proofs"`);
    await queryRunner.query(`DROP TABLE "dispute_messages"`);
    await queryRunner.query(`DROP TABLE "dispute_evidence"`);
    await queryRunner.query(`DROP TABLE "disputes"`);
    await queryRunner.query(`DROP TABLE "escrow_milestones"`);
    await queryRunner.query(`DROP TABLE "escrows"`);
    await queryRunner.query(`DROP TABLE "risk_assessments"`);
    await queryRunner.query(`DROP TABLE "withdrawals"`);
    await queryRunner.query(`DROP TABLE "deposits"`);
    await queryRunner.query(`DROP TABLE "payments"`);
    await queryRunner.query(`DROP TABLE "wallets"`);
    await queryRunner.query(`DROP TABLE "users"`);

    // Drop enum types
    await queryRunner.query(
      `DROP TYPE "public"."notification_preferences_channel_enum"`
    );
    await queryRunner.query(
      `DROP TYPE "public"."notification_preferences_type_enum"`
    );
    await queryRunner.query(`DROP TYPE "public"."notifications_channel_enum"`);
    await queryRunner.query(`DROP TYPE "public"."notifications_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."transaction_logs_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."delivery_proofs_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."delivery_proofs_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."dispute_evidence_type_enum"`);
    await queryRunner.query(`DROP TYPE "public"."disputes_resolution_enum"`);
    await queryRunner.query(`DROP TYPE "public"."disputes_status_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."escrow_milestones_status_enum"`
    );
    await queryRunner.query(`DROP TYPE "public"."escrows_status_enum"`);
    await queryRunner.query(
      `DROP TYPE "public"."risk_assessments_risklevel_enum"`
    );
    await queryRunner.query(`DROP TYPE "public"."withdrawals_method_enum"`);
    await queryRunner.query(`DROP TYPE "public"."withdrawals_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."deposits_method_enum"`);
    await queryRunner.query(`DROP TYPE "public"."deposits_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."payments_threedsstatus_enum"`);
    await queryRunner.query(`DROP TYPE "public"."payments_method_enum"`);
    await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_mfamethod_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_status_enum"`);
    await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
  }
}
