import {PrismaService} from "../../../../prisma.service";
import {BadRequestException, Injectable} from "@nestjs/common";
import {CreateMultipleDeductionDto, DeleteMultipleDeductionDto} from "./dto";

@Injectable()
export class DeductionRepository {
  constructor(private readonly prisma: PrismaService) {
  }

  async createMany(body: CreateMultipleDeductionDto[]) {
    try {
      return await this.prisma.deductionSalary.createMany({data: body});
    } catch (err) {
      console.error(err);
      throw new BadRequestException(err);
    }
  }

  async findAll() {
    try {
      return await this.prisma.deductionSalary.findMany();
    } catch (err) {
      console.error(err);
      throw new BadRequestException(err);
    }
  }

  async findOne(id: number) {
    try {
      return await this.prisma.deductionSalary.findUnique({where: {id}});
    } catch (err) {
      console.error(err);
      throw new BadRequestException(err);
    }
  }

  async updateMany(ids: number[], body: CreateMultipleDeductionDto) {
    try {
      return await this.prisma.deductionSalary.updateMany({where: {id: {in: ids}}, data: body});
    } catch (err) {
      console.error(err);
      throw new BadRequestException(err);
    }
  }

  async removeMany(body: DeleteMultipleDeductionDto) {
    try {
      return await this.prisma.deductionSalary.deleteMany({where: {id: {in: body.salaryIds}}});
    } catch (err) {
      console.error(err);
      throw new BadRequestException(err);
    }
  }
}
