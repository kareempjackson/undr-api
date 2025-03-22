import {
  IsNumber,
  IsNotEmpty,
  IsString,
  IsOptional,
  Min,
  IsObject,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class PayByAliasDto {
  @ApiProperty({
    example: "creator_ab12cd34",
    description: "Alias of the creator to pay",
  })
  @IsString()
  @IsNotEmpty()
  toAlias: string;

  @ApiProperty({
    example: 20,
    description: "Amount to pay",
  })
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

  @ApiProperty({
    example: {
      paymentType: "subscription",
      month: "March",
      visibility: "private",
    },
    description: "Additional metadata for the payment",
    required: false,
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
