import {
  IsNumber,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  Min,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { PaymentMethod } from "../../../entities/payment.entity";

export class DepositDto {
  @ApiProperty({ example: 100, description: "Amount to deposit" })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD,
    description: "Payment method for deposit",
  })
  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;
}

export class PayCreatorDto {
  @ApiProperty({ example: "creator-uuid", description: "Creator ID to pay" })
  @IsString()
  @IsNotEmpty()
  creatorId: string;

  @ApiProperty({ example: 20, description: "Amount to pay" })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  amount: number;

  @ApiProperty({
    example: "Monthly subscription payment",
    description: "Payment description",
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}

export * from "./deposit.dto";
export * from "./pay-creator.dto";
export * from "./complete-deposit.dto";
