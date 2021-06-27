import {BadRequestException, Injectable} from "@nestjs/common";
import {PrismaService} from "../../../prisma.service";

@Injectable()
export class HistorySalaryRepository {
  constructor(private readonly prisma: PrismaService) {
  }

  async create(salaryId: number, employeeId: number) {
    try {
      return await this.prisma.historySalary.create({
        data: {
          employeeId: employeeId,
          salaryId: salaryId,
          datetime: new Date(),
        }
      });
    } catch (err) {
      console.error(err);
      throw new BadRequestException(err);
    }
  }
}
