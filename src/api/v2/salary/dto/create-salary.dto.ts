import {ICreateSalaryDto} from "../../../../common/dtos/create-salary.dto";
import {Type} from "class-transformer";
import {IsArray, IsNumber, IsOptional,} from "class-validator";

export class CreateSalaryDto extends ICreateSalaryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  readonly employeeId: number;

  @IsOptional()
  @IsArray()
  readonly employeeIds?: number[];

  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  readonly payrollId: number;
}
