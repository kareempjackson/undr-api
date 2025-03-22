import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class CompleteDepositDto {
  @ApiProperty({
    description: "ID of the deposit to complete",
    example: "5f8d0d55b54764421b71958a",
  })
  @IsNotEmpty()
  @IsString()
  depositId: string;

  @ApiProperty({
    description: "ID of the payment intent from Stripe",
    example: "pi_3Nt3GiHsXFwQYV9G1rJxRFYS",
  })
  @IsNotEmpty()
  @IsString()
  paymentIntentId: string;
}
