import {IsDate, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString} from "class-validator";
import {Transform, Type} from "class-transformer";
import {DatetimeUnit, PartialDay, SalaryType} from "@prisma/client";
import * as moment from "moment";

export class CreateSalaryv2Dto {
  @IsOptional({message: "Bạn phải chọn loại vắng", groups: ["absent", "overtime"]})
  @IsNumber()
  @Type(() => Number)
  readonly settingId: number;

  @IsOptional({message: "Bạn phải nhập đơn giá", groups: ["basic", "stay"]})
  @IsNumber()
  @Type(() => Number)
  readonly price: number;

  @IsNotEmpty({message: "Bạn phải nhập tiêu đề"})
  @IsString()
  readonly title: string;

  @IsNotEmpty({message: "Bạn phải chọn ít nhất 1 phiếu lương"})
  @IsNumber({allowNaN: false}, {each: true})
  @Type(() => Number)
  readonly payrollIds: number[];

  @IsNotEmpty({message: "Bạn phải chọn buổi", groups: ["absent", "overtime"]})
  @IsEnum(PartialDay, {groups: ["absent", "overtime"]})
  readonly partial: PartialDay;

  @IsNotEmpty({message: "Bạn phải chọn buổi", groups: ["absent", "overtime"]})
  @IsEnum(DatetimeUnit, {groups: ["absent", "overtime"]})
  readonly unit: DatetimeUnit;

  @IsNotEmpty({message: "Bạn phải loại lương"})
  @IsEnum(SalaryType)
  readonly type: SalaryType;

  @IsOptional({message: "Bạn phải chọn đầy đủ từ ngày đến ngày", groups: ["absent", "overtime"]})
  @IsDate()
  @Transform(({value}) => {
    if (value) {
      return  new Date(moment(value).utc().format('YYYY-MM-DD'))
    }
  })
  readonly startedAt: Date;

  @IsOptional({message: "Bạn phải chọn đầy đủ từ ngày đến ngày", groups: ["absent", "overtime"]})
  @IsDate()
  @Transform(({value}) => {
    if (value) {
      return  new Date(moment(value).utc().format('YYYY-MM-DD'))
    }
  })
  readonly endedAt: Date;

  @IsOptional({message: "Bạn phải chọn đầy đủ từ ngày đến ngày", groups: ["absent", "overtime"]})
  @IsDate()
  @Transform(({value}) => {
    if (value) {
      return new Date(value);
    }
  })
  readonly startTime: Date;

  @IsOptional({message: "Bạn phải chọn đầy đủ từ ngày đến ngày", groups: ["absent", "overtime"]})
  @IsDate()
  @Transform(({value}) => {
    if (value) {
      return new Date(value);
    }
  })
  readonly endTime: Date;

  @IsOptional()
  @IsString()
  readonly note: string;
}
