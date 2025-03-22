import { IsNumber, IsNotEmpty, IsEnum, Min } from "class-validator";
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
