import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsUUID,
  IsNumber,
  IsOptional,
  Min,
  IsArray,
  IsEnum,
  ValidateNested,
  IsObject,
  IsPositive,
  ArrayMinSize,
  IsInt,
  IsUrl,
} from "class-validator";
import { Type } from "class-transformer";
import { ProofType } from "../entities/delivery-proof.entity";
import { EscrowStatus } from "../entities/escrow.entity";

export class EscrowCreateDTO {
  @ApiProperty({ description: "User ID of the buyer/sender" })
  @IsUUID()
  fromUserId: string;

  @ApiProperty({ description: "User ID of the seller/recipient" })
  @IsUUID()
  toUserId: string;

  @ApiProperty({ description: "Amount to be held in escrow" })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    description: "Payment ID for the escrow funding",
    required: false,
  })
  @IsUUID()
  @IsOptional()
  paymentId: string;

  @ApiProperty({
    description: "Stripe Payment Intent ID if applicable",
    required: false,
  })
  @IsString()
  @IsOptional()
  stripePaymentIntentId?: string;

  @ApiProperty({ description: "Additional metadata", required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class MilestoneDTO {
  @ApiProperty({ description: "Amount for this milestone" })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({ description: "Description of the milestone" })
  @IsString()
  description: string;

  @ApiProperty({ description: "Sequence number of the milestone" })
  @IsInt()
  @Min(1)
  sequence: number;
}

export class EscrowDetailedCreateDTO {
  @ApiProperty({ description: "Title of the escrow agreement" })
  @IsString()
  title: string;

  @ApiProperty({
    description: "Description of the escrow agreement",
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: "Total amount to be escrowed" })
  @IsNumber()
  @IsPositive()
  totalAmount: number;

  @ApiProperty({ description: "User ID of the seller" })
  @IsUUID()
  sellerId: string;

  @ApiProperty({ description: "Number of days until the escrow expires" })
  @IsInt()
  @Min(1)
  expirationDays: number;

  @ApiProperty({
    description: "Milestones for the escrow",
    type: [MilestoneDTO],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => MilestoneDTO)
  milestones: MilestoneDTO[];

  @ApiProperty({ description: "Legal terms and conditions", required: false })
  @IsObject()
  @IsOptional()
  terms?: Record<string, any>;

  @ApiProperty({
    description: "Document URLs for the agreement",
    required: false,
  })
  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  documents?: string[];
}

export class DeliveryProofSubmitDTO {
  @ApiProperty({
    description: "Type of proof being submitted",
    enum: ProofType,
  })
  @IsEnum(ProofType)
  type: ProofType;

  @ApiProperty({ description: "Description of the proof", required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: "File URLs for the proof" })
  @IsArray()
  @IsString({ each: true })
  files: string[];

  @ApiProperty({ description: "Additional metadata", required: false })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ReviewProofDTO {
  @ApiProperty({ description: "Whether to accept the proof" })
  @IsEnum(["accept", "reject"])
  decision: "accept" | "reject";

  @ApiProperty({
    description: "Reason for rejection if applicable",
    required: false,
  })
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

export class EscrowFilterDTO {
  @ApiProperty({
    description: "Filter by escrow status",
    enum: EscrowStatus,
    required: false,
  })
  @IsEnum(EscrowStatus)
  @IsOptional()
  status?: EscrowStatus;

  @ApiProperty({
    description: "Maximum number of results to return",
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;

  @ApiProperty({
    description: "Number of results to skip for pagination",
    required: false,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  offset?: number;
}
