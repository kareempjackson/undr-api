import {
  IsNumber,
  IsNotEmpty,
  IsString,
  Min,
  IsOptional,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

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
