import {EmployeeType, Salary} from "@prisma/client";
import {
  IsDate, IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  MaxDate,
} from "class-validator";
import {Transform, Type} from "class-transformer";
import {ValidatorMessage} from "../../../../common/constant/validator.constant";
import {tomorrowDate} from "../../../../utils/datetime.util";
import {CreateSalaryDto} from "../../salary/dto/create-salary.dto";

export class CreatePayrollDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  readonly employeeId: number;

  @IsNotEmpty()
  @Type(() => Date)
  @Transform(val => new Date(val.value))
  @IsDate()
  readonly createdAt: Date;
}
