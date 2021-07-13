import {BadRequestException, Injectable} from '@nestjs/common';
import {Commodity, Order} from '@prisma/client';
import {PrismaService} from "../../../prisma.service";

@Injectable()
export class BillService {
  constructor(private readonly prisma: PrismaService) {
  }

  async findAll() {
    try {
      const [total, data] = await Promise.all([
        this.prisma.order.count({
          where: {
            paidAt: {not: null}
          }
        }),
        this.prisma.order.findMany({
          where: {
            paidAt: {not: null}
          },
          include: {
            customer: true,
            routes: true,
            commodities: true,
          }
        })
      ]);
      return {total, data};
    } catch (err) {
      console.error(err);
      throw new BadRequestException(err);
    }
  }

  async findOne(id: number) {
    try {
      const bill = await this.prisma.order.findFirst({
        where: {
          id: id,
          paidAt: {not: null}
        },
        include: {commodities: true, customer: true}
      });
      const remaining = this.remainingBalance(bill);
      return {bill, remaining};
    } catch (err) {
      console.error(err);
      throw new BadRequestException(err);
    }
  }

  async update() {

  }

  remainingBalance(bill: Order | any) {
    const amount = bill.commodities.reduce((a: Commodity, b: Commodity) => {
      return a.price + b.price;
    }, 0);
    console.log(amount);
    console.log(bill.paidTotal - amount);
    let a = [];
    return bill.paidTotal - amount;
  }
}
