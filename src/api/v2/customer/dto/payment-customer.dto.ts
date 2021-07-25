import {IsEnum, IsNumber, IsOptional} from "class-validator";
import {Transform, Type} from "class-transformer";
import {PaymentType} from "@prisma/client";

export class PaymentCustomerDto {
  @IsOptional()
  @Type(() => Date)
  readonly paidAt?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  readonly paidTotal?: number;

  @IsOptional()
  @IsEnum(PaymentType)
  readonly payType?: PaymentType;
}
