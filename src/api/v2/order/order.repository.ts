import {BadRequestException, Injectable} from "@nestjs/common";
import {PrismaService} from "../../../prisma.service";
import {CreateOrderDto} from "./dto/create-order.dto";
import {UpdateOrderDto} from "./dto/update-order.dto";
import {PaidEnum} from "./enums/paid.enum";
import {Customer, PaymentType, PrismaPromise} from "@prisma/client";

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {
  }

  async create(body: CreateOrderDto) {
    try {
      return await this.prisma.order.create({
        data: {
          customerId: body.customerId,
          createdAt: body.createdAt,
          explain: body.explain,
          commodities: {
            connect: body.commodityIds.map(id => ({id}))
          },
          wardId: body.destinationId,
        },
        include: {
          commodities: true
        }
      });
    } catch (err) {
      console.error('order create', err);
      throw new BadRequestException(err);
    }
  }

  async findOne(id: number) {
    try {
      return await this.prisma.order.findUnique({
        where: {id},
        include: {
          commodities: true,
          customer: true,
          routes: true,
          destination: {
            include: {
              district: {
                include: {
                  province: {
                    include: {
                      nation: true
                    }
                  }
                }
              }
            }
          },
          paymentHistories: true
        }
      });
    } catch (err) {
      console.error(err);
      throw new BadRequestException(err);
    }
  }

  async findAll(
    skip: number,
    take: number,
    customerId?: number,
    paidType?: PaidEnum,
    firstName?: string,
    lastName?: string,
    payType?: PaymentType,
    delivered?: number
  ) {
    try {
      const [total, data] = await Promise.all([
        this.prisma.order.count({
          where: {
            deliveredAt: delivered === 1 ? {not: null} : null,
            customerId: customerId ? {in: customerId} : {},
            // paidAt: paidType === PaidEnum.PAID || paidType === PaidEnum.DEBT ? {not: null} : (paidType === PaidEnum.UNPAID ? {in: null} : {}),
            // debt: paidType === PaidEnum.DEBT ? {not: 0} : {},
            customer: {
              AND: {
                firstName: {startsWith: firstName, mode: 'insensitive'},
                lastName: {startsWith: lastName, mode: 'insensitive'},
              },
            },
            // payType: payType ? {in: payType} : {}
          },
        }),
        this.prisma.order.findMany({
          skip, take,
          where: {
            deliveredAt: delivered === 1 ? {not: null} : null,
            customerId: customerId ? {in: customerId} : {},
            // paidAt: paidType === PaidEnum.PAID || paidType === PaidEnum.DEBT ? {not: null} : (paidType === PaidEnum.UNPAID ? {in: null} : {}),
            // debt: paidType === PaidEnum.DEBT ? {not: 0} : {},
            customer: {
              AND: {
                firstName: {startsWith: firstName, mode: 'insensitive'},
                lastName: {startsWith: lastName, mode: 'insensitive'},
              },
            },
            // payType: payType ? {in: payType} : {}
          },
          include: {
            commodities: true,
            customer: true,
            destination: {
              include: {
                district: {
                  include: {
                    province: {
                      include: {
                        nation: true
                      }
                    }
                  }
                }
              }
            },
            paymentHistories: true
          }
        }),
      ]);
      return {
        total, data
      };
    } catch (err) {
      console.error(err);
      throw new BadRequestException(err);
    }
  }

  /*
  * Order thì Thêm mới hoặc xoá hàng hoá. 1 hàng hoá chỉ tồn tại cho 1 đơn hàng
  * */
  async update(id: number, updates: UpdateOrderDto) {
    try {
      if (updates.totalOrder) {
        const updated = this.prisma.order.update({
          where: {id},
          data: {
            commodities: {connect: updates.commodityIds.map((id => ({id: id})))}
          },
        });
        // Nếu đơn hàng được cập nhật lại hàng hóa thì giá tiền sẽ thay đổi => Dư nợ thay đổi
        return await this.transactionDebt(updated, updates.customerId, updates.totalOrder);
      }

      return await this.prisma.order.update({
        where: {id},
        data: {
          customerId: updates.customerId,
          createdAt: updates.createdAt,
          explain: updates.explain,
          wardId: updates.destinationId,
          deliveredAt: updates.deliveredAt,
        },
      });
    } catch (err) {
      console.error(err);
      throw new BadRequestException(err);
    }
  }

  async remove(id: number) {
    try {
      await this.prisma.order.delete({where: {id}});
    } catch (err) {
      console.error(err);
      throw new BadRequestException(err);
    }
  }

  async transactionDebt(handle: PrismaPromise<any>, customerId: Customer['id'], newDebt: number) {
    try {

      /// update debt customer for this order
      const updatedDebt = this.prisma.customer.update({
        where: {id: customerId},
        data: {debt: newDebt}
      });

      /// handle transaction
      await this.prisma.$transaction([handle, updatedDebt]);
    } catch (err) {
      console.error(err);
      throw new BadRequestException(err);
    }
  }
}
