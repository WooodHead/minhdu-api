import { BadRequestException, Injectable } from "@nestjs/common";
import { Position } from "@prisma/client";
import { CreatePositionDto } from "./dto/create-position.dto";
import { UpdatePositionDto } from "./dto/update-position.dto";
import { PositionRepository } from "./position.repository";
import { BasePositionService } from "./base-position.service";
import { OnePosition } from "./entities/position.entity";
import {ResponsePagination} from "../../entities/response.pagination";

@Injectable()
export class PositionService implements BasePositionService {
  constructor(private readonly repository: PositionRepository) {}

  async create(body: CreatePositionDto): Promise<Position> {
    const positions = this.findBy(body);
    if (!(await positions).length && body.name) {
      return await this.repository.create(body);
    } else if (body.positionId && body.workday) {
      return await this.update(body.positionId, { workday: body.workday });
    }
  }

  // @ts-ignore
  async findAll(): Promise<Position[]> {
    return this.repository.findAll();
  }

  async findBy(query: CreatePositionDto): Promise<Position[]> {
    return await this.repository.findMany(query);
  }

  findBranch(id: number): Promise<any> {
    return this.repository.findBranch(id);
  }

  async findOne(id: number): Promise<OnePosition> {
    return this.repository.findOne(id);
  }

  async update(id: number, updates: UpdatePositionDto) {
    return await this.repository.update(id, updates);
  }

  async remove(id: number) {
    const found = await this.findOne(id);
    if (
      (found.workHistories && found.workHistories.length) ||
      (found.templates && found.templates.length) ||
      (found.employees && found.employees.length)
    ) {
      const name =
        found.workHistories
          .map((e) => "nhân viên " + e.employeeId)
          .join(", ") ||
        found.templates.map((e) => e.title).join(", ") ||
        found.employees.map((e) => e.lastName).join(", ");
      throw new BadRequestException(
        `${found.name} đang được liên kết với các mục ${name}. Hãy xóa chúng trước khi xóa trường này.`
      );
    }
    return this.repository.remove(id);
  }
}
