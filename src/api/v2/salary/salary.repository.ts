import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { SalaryType } from "@prisma/client";
import * as moment from "moment";
import { PrismaService } from "../../../prisma.service";
import { CreateSalaryDto } from "./dto/create-salary.dto";
import { UpdateSalaryDto } from "./dto/update-salary.dto";
import { OneSalary } from "./entities/salary.entity";

@Injectable()
export class SalaryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: CreateSalaryDto) {
    try {
      // Ngày lễ chỉ được nghỉ nữa ngày hoặc 1 ngày. Không được đi trễ / đến sớm, về muộn
      if (body.type === SalaryType.ABSENT || body.type === SalaryType.DAY_OFF) {
        const holidays = await this.prisma.holiday.findMany({
          where: {
            datetime: {
              in: body.datetime as Date,
            },
          },
        });

        if (
          holidays
            .map((holiday) => moment(holiday.datetime).format("MM/DD/YYYY"))
            .includes(moment(body.datetime as Date).format("MM/DD/YYYY"))
        ) {
          if (body.times !== 1 && body.times !== 0) {
            throw new BadRequestException(
              `${moment(body.datetime as Date).format(
                "DD/MM/YYYY"
              )} là lễ nên không được phép nghỉ số số tiếng. Chỉ được phép nghỉ 1 ngày hoặc nửa ngày thôi.`
            );
          }
        }
      }

      return await this.prisma.salary.create({
        data: {
          title: body.title,
          type: body.type,
          unit: body.unit,
          datetime: body.datetime as Date,
          times: body.times,
          forgot: body.forgot,
          rate: body.rate,
          price: body.price,
          note: body.note,
          payroll: { connect: { id: body.payrollId } },
          allowance: body?.allowance?.title
            ? {
                create: {
                  title: body.allowance.title,
                  type: SalaryType.OVERTIME,
                  price: body.allowance.price,
                },
              }
            : {},
        },
      });
    } catch (err) {
      console.error(err);
      throw new BadRequestException("Thất bại", err);
    }
  }

  async findBy(query: any): Promise<any> {
    try {
      return this.prisma.salary.findFirst({ where: {} });
    } catch (err) {
      console.error(err);
      throw new BadRequestException(err);
    }
  }

  // async findMany(body: CreateSalaryDto) {
  //   return await this.prisma.salary.findFirst({ where: body });
  // }

  async findOne(id: number): Promise<OneSalary> {
    try {
      return await this.prisma.salary.findUnique({
        where: { id },
        include: { payroll: true },
      });
    } catch (err) {
      console.error(err);
      throw new NotFoundException(err);
    }
  }

  async update(id: number, updates: UpdateSalaryDto) {
    try {
      const salary = await this.findOne(id);
      if (salary.payroll.paidAt) {
        throw new BadRequestException(
          "Bảng lương đã thanh toán không được phép sửa"
        );
      }
      return await this.prisma.salary.update({
        where: { id: id },
        data: {
          title: updates.title,
          type: updates.type,
          unit: updates.unit,
          datetime: updates.datetime as Date,
          times: updates.times,
          forgot: updates.forgot,
          rate: updates.rate,
          price: updates.price,
          note: updates.note,
          allowance: updates.allowance
            ? {
                upsert: {
                  create: {
                    title: updates.allowance?.title,
                    price: updates.allowance?.price,
                    type: SalaryType.OVERTIME,
                  },
                  update: {
                    title: updates.allowance?.title,
                    price: updates.allowance?.price,
                  },
                },
              }
            : {},
        },
      });
    } catch (err) {
      console.error(err);
      throw new BadRequestException(err);
    }
  }

  async remove(id: number) {
    try {
      const payroll = await this.prisma.payroll.findUnique({ where: { id } });
      if (payroll?.paidAt) {
        throw new BadRequestException(
          "Bảng lương đã thanh toán không được phép xoá"
        );
      }

      return await this.prisma.salary.delete({ where: { id: id } });
    } catch (err) {
      console.error(err);
      throw new BadRequestException(err);
    }
  }
}
