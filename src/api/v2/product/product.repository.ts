import {BadRequestException, Injectable} from "@nestjs/common";
import {CreateProductDto} from "./dto/create-product.dto";
import {UpdateProductDto} from "./dto/update-product.dto";
import {PrismaService} from "../../../prisma.service";
import {SearchProductDto} from "./dto/search-product.dto";

@Injectable()
export class ProductRepository {
  constructor(private readonly prisma: PrismaService) {
  }

  async create(body: CreateProductDto) {
    try {
      return await this.prisma.product.create({
        data: {
          code: body.code,
          name: body.name,
          supplierId: body.supplierId,
          categoryId: body.categoryId,
          note: body?.note,
          unit: body?.unit,
        }
      });
    } catch (err) {
      console.error(err);
      throw new BadRequestException(err);
    }
  }

  async findAll(search: SearchProductDto) {
    try {
      const [total, data] = await Promise.all([
        this.prisma.product.count({
          where: {
            name: search?.name ? {contains: search.name} : {},
            category: search?.warehouseId ? {id: search.warehouseId} : {},
          },
        }),
        this.prisma.product.findMany({
          take: search?.take,
          skip: search?.skip,
          where: {
            name: search?.name ? {contains: search.name} : {},
            category: search?.warehouseId ? {id: search.warehouseId} : {},
          },
          include: {
            supplier: true,
            category: true,
          },
        }),
      ]);
      return {total, data};
    } catch (err) {
      console.error(err);
      throw new BadRequestException(err);
    }
  }

  async findOne(id: number) {
    try {
      return await this.prisma.product.findUnique({
        where: {id},
        include: {
          supplier: true,
          category: true,
        }
      });
    } catch (err) {
      console.error(err);
      throw new BadRequestException(err);
    }
  }

  async update(id: number, updates: Partial<UpdateProductDto>) {
    try {
      return await this.prisma.product.update({
        where: {id},
        data: {
          name: updates.name,
          code: updates.code,
          category: updates?.categoryId
            ? {connect: {id: updates.categoryId}}
            : {},
          supplier: updates?.supplierId
            ? {connect: {id: updates.supplierId}}
            : {},
          note: updates.note,
          unit: updates.unit,
        },
      });
    } catch (err) {
      console.error(err);
      throw new BadRequestException(err);
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.product.delete({where: {id}});
    } catch (err) {
      console.error(err);
      throw new BadRequestException(err);
    }
  }
}
