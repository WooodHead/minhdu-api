import {BadRequestException, Injectable, NotFoundException} from "@nestjs/common";
import {Branch, Employee, EmployeeType, Payroll, Position, SalaryType} from "@prisma/client";
import {ProfileEntity} from "../../../common/entities/profile.entity";
import {PrismaService} from "../../../prisma.service";
import {firstDatetime, lastDatetime} from "../../../utils/datetime.util";
import {CreatePayrollDto} from "./dto/create-payroll.dto";
import {SearchPayrollDto} from "./dto/search-payroll.dto";
import {UpdatePayrollDto} from "./dto/update-payroll.dto";
import {CreateSalaryDto} from "../salary/dto/create-salary.dto";
import * as moment from "moment";
import {SearchType} from "./entities/search.type.enum";
import {Promise} from "es6-promise";
import {FilterTypeEnum} from "./entities/filter-type.enum";
import {SearchSalaryDto} from "./dto/search-salary.dto";
import {OrderbyEmployeeEnum} from "../employee/enums/orderby-employee.enum";

@Injectable()
export class PayrollRepository {
  constructor(private readonly prisma: PrismaService) {
  }

  async create(body: CreatePayrollDto & { employee?: Employee & { branch: Branch, position: Position } }) {
    try {
      const payrolls = await this.prisma.payroll.findMany({
        where: {
          employee: {id: {in: body.employeeId}},
          salaries: {
            some: {
              type: {in: [SalaryType.BASIC, SalaryType.BASIC_INSURANCE, SalaryType.STAY]}
            },
          }
        },
        include: {salaries: true},
      });

      const salaries = payrolls.find(payroll => payroll.salaries.length)?.salaries?.filter(
        (salary) =>
          salary.type === SalaryType.BASIC ||
          salary.type === SalaryType.BASIC_INSURANCE ||
          salary.type === SalaryType.STAY
      );

      return await this.prisma.payroll.create({
        data: {
          employee: {connect: {id: body?.employeeId || body.employee.id}},
          createdAt: body.createdAt,
          branch: body.employee.branch.name,
          position: body.employee.position.name,
          salaries: salaries?.length
            ? {
              createMany: {
                data: salaries.map((salary) => {
                  delete salary.payrollId;
                  delete salary.id;
                  return salary;
                }),
              },
            }
            : {},
        },
        include: {salaries: true},
      });
    } catch (err) {
      console.error(err);
      if (err.code === "P2003") {
        throw new BadRequestException(
          "[DEVELOPMENT] Mã nhân viên không tồn tại ",
          err
        );
      }
      throw new BadRequestException(err);
    }
  }

  /// tạo ngày lễ cho phiếu lương đó
  async generateHoliday(payrollId: Payroll["id"], body: Partial<CreateSalaryDto>[]) {
    try {
      if (!body?.length) {
        return await this.prisma.payroll.update({
          where: {id: payrollId},
          data: {
            salaries: {
              deleteMany: {
                type: SalaryType.HOLIDAY
              },
            }
          }
        });
      }
      return await this.prisma.payroll.update({
        where: {id: payrollId},
        data: {
          salaries: {
            deleteMany: {
              type: SalaryType.HOLIDAY
            },
            createMany: {
              data: body.map(holiday => ({
                title: holiday.title,
                price: holiday?.price,
                type: SalaryType.HOLIDAY,
                datetime: holiday.datetime as Date,
                times: holiday.times,
                rate: holiday.rate,
              }))
            }
          }
        }
      });
    } catch (err) {
      console.error(err);
      throw new BadRequestException("Khởi tạo ngày lễ xảy ra lõi. Vui lòng thao tác lại. Nếu không được hãy liên hệ admin. Xin cảm ơn");
    }
  }

  async findAll(profile: ProfileEntity, search?: Partial<SearchPayrollDto>) {
    const acc = await this.prisma.account.findUnique({
      where: {id: profile.id},
      include: {branches: true, role: true}
    });

    try {
      const [total, data] = await Promise.all([
        this.prisma.payroll.count({
          where: {
            employeeId: search?.employeeId ? {in: +search.employeeId} : {},
            employee: {
              leftAt: search?.isLeave ? {notIn: null} : {in: null},
              lastName: {contains: search?.name, mode: "insensitive"},
              type: search?.employeeType ? {in: search?.employeeType} : {},
              category: search?.categoryId ? {id: {in: search?.categoryId}} : {}
            },
            branch: acc.branches?.length ? {
              in: acc.branches.map(branch => branch.name),
              mode: "insensitive"
            } : {startsWith: search?.branch, mode: "insensitive"},
            position: {startsWith: search?.position, mode: "insensitive"},
            createdAt: {
              gte: firstDatetime(search?.createdAt),
              lte: lastDatetime(search?.createdAt),
            },
            paidAt: null,
          },
        }),
        this.prisma.payroll.findMany({
          take: search?.take,
          skip: search?.skip,
          where: {
            employeeId: search?.employeeId ? {in: +search.employeeId} : {},
            employee: {
              leftAt: search?.isLeave ? {notIn: null} : {in: null},
              lastName: {contains: search?.name, mode: "insensitive"},
              type: search?.employeeType ? {in: search?.employeeType} : {},
              category: search?.categoryId ? {id: {in: search?.categoryId}} : {}
            },
            branch: acc.branches?.length ? {
              in: acc.branches.map(branch => branch.name),
              mode: "insensitive"
            } : {startsWith: search?.branch, mode: "insensitive"},
            position: {startsWith: search?.position, mode: "insensitive"},
            createdAt: {
              gte: firstDatetime(search?.createdAt),
              lte: lastDatetime(search?.createdAt),
            },
            paidAt: null,
          },
          include: {
            salaries: true,
            employee: {
              include: {
                contracts: true,
                position: true,
                branch: true,
                category: true
              },
            },
          },
          orderBy: {
            employee: search?.orderBy && search?.orderType
              ? search.orderBy === OrderbyEmployeeEnum.CREATE
                ? {createdAt: search.orderType}
                : search.orderBy === OrderbyEmployeeEnum.POSITION
                  ? {position: {name: search.orderType}}
                  : search.orderBy === OrderbyEmployeeEnum.NAME
                    ? {lastName: search.orderType}
                    : {}
              : {stt: "asc"}
          }
        }),
      ]);

      return {total, data};
    } catch (e) {
      console.error(e);
      throw new BadRequestException(e);
    }
  }

  async findSalaries(profile: ProfileEntity, search?: Partial<SearchPayrollDto>) {
    const [total, data] = await Promise.all([
      this.prisma.salary.count({
        where: {
          datetime: search?.createdAt && search?.filterType === SalaryType.ABSENT ? {
            in: search?.createdAt
          } : search?.startedAt && search?.endedAt ? {
            gte: search?.startedAt,
            lte: search?.endedAt,
          } : {
            gte: firstDatetime(search?.createdAt),
            lte: lastDatetime(search?.createdAt),
          },
          title: {startsWith: search?.title, mode: "insensitive"},
          price: search?.salaryPrice ? {equals: search?.salaryPrice} : {},
          type: search?.filterType
            ? {
              in: search?.filterType === FilterTypeEnum.BASIC
                ? [SalaryType.BASIC, SalaryType.BASIC_INSURANCE]
                : search.filterType === FilterTypeEnum.ABSENT
                  ? [SalaryType.ABSENT, SalaryType.DAY_OFF]
                  : search.filterType as SalaryType
            }
            : {},
          payroll: {
            branch: profile.branches?.length
              ? {in: profile.branches.map(branch => branch.name)}
              : {startsWith: search?.branch, mode: "insensitive"}
          }
        },
      }),
      this.prisma.salary.findMany({
        take: search?.take,
        skip: search?.skip,
        where: {
          datetime: search?.createdAt && search?.filterType === SalaryType.ABSENT ? {
            in: search?.createdAt
          } : search?.startedAt && search?.endedAt ? {
            gte: search?.startedAt,
            lte: search?.endedAt,
          } : {
            gte: firstDatetime(search?.createdAt),
            lte: lastDatetime(search?.createdAt),
          },
          title: {startsWith: search?.title, mode: "insensitive"},
          price: search?.salaryPrice ? {equals: search?.salaryPrice} : {},
          type: search?.filterType
            ? {
              in: search?.filterType === FilterTypeEnum.BASIC
                ? [SalaryType.BASIC, SalaryType.BASIC_INSURANCE]
                : search.filterType === FilterTypeEnum.ABSENT
                  ? [SalaryType.ABSENT, SalaryType.DAY_OFF]
                  : search.filterType as SalaryType
            }
            : {},
          payroll: {
            branch: profile.branches?.length
              ? {in: profile.branches.map(branch => branch.name)}
              : {startsWith: search?.branch, mode: "insensitive"}
          }
        },
        include: {
          payroll: {
            include: {
              employee: {
                include: {
                  position: true,
                  branch: true
                }
              }
            }
          }
        },
        orderBy: {
          payroll: {
            employee: {
              stt: "asc"
            }
          }
        }
      })
    ]);
    return {
      total, data: data.map(salary => {
        return {
          employeeId: salary.payroll.employeeId,
          id: salary.id,
          payrollId: salary.payrollId,
          salaries: Array.of(salary),
          employee: salary.payroll.employee
        };
      })
    };
  }

  async findFirst(query: any) {
    try {
      return await this.prisma.payroll.findFirst({
        where: query
      });
    } catch (err) {
      console.error(err);
      throw new BadRequestException(err);
    }
  }

  async findOne(id: number) {
    try {
      const payroll = await this.prisma.payroll.findUnique({
        where: {id: id},
        include: {
          salaries: {
            include: {
              allowance: true
            }
          },
          employee: {
            include: {
              contracts: true,
              position: true,
              branch: true,
              category: true
            },
          },
        },
      });

      if (!payroll) {
        throw new NotFoundException("Phiếu lương không tồn tại");
      }

      const payrolls = await this.findIds(payroll.createdAt, payroll.employee.type, payroll.employee.branchId);
      return Object.assign(payroll, {payrollIds: payrolls.map(payroll => payroll.id)});
    } catch (e) {
      console.error(e);
      throw new BadRequestException(e);
    }
  }

  async update(id: number, updates: UpdatePayrollDto) {
    try {
      // Chỉ xác nhận khi phiếu lương có tồn tại giá trị
      const payroll = await this.findOne(id);
      if ((updates?.manConfirmedAt || updates?.accConfirmedAt)) {
        if (!payroll.salaries.length) {
          throw new BadRequestException(`Không thể xác nhận phiếu lương rỗng`);
        }
        if (payroll.salaries.every(salary => (salary.type === SalaryType.BASIC_INSURANCE || salary.type === SalaryType.BASIC))) {
          throw new BadRequestException(`Không thể xác nhận phiếu lương có lương cơ bản rỗng`);
        }
      }

      if (moment(updates?.accConfirmedAt || updates?.manConfirmedAt).isBefore(payroll.createdAt)) {
        throw new BadRequestException(`Không thể xác nhận phiếu lương trước ngày vào làm. Vui lòng kiểm tra lại.`);
      }

      return await this.prisma.payroll.update({
        where: {id: id},
        data: {
          isEdit: !!updates?.accConfirmedAt,
          accConfirmedAt: updates?.accConfirmedAt,
          paidAt: updates?.paidAt,
          total: updates?.total,
          manConfirmedAt: updates?.manConfirmedAt,
          actualday: updates?.actualday,
          taxed: updates?.taxed,
          createdAt: updates?.createdAt,
          note: updates?.note,
        },
        include: {
          employee: {
            include: {
              position: true,
              branch: true,
              contracts: true
            }
          },
          salaries: true,
        }
      });
    } catch (e) {
      console.error(e);
      throw new BadRequestException(e);
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.payroll.delete({where: {id: id}});
    } catch (err) {
      console.error(err);
      throw new BadRequestException(err);
    }
  }

  async findOvertimesV2(profile: ProfileEntity, search: Partial<SearchPayrollDto>) {
    const acc = await this.prisma.account.findUnique({where: {id: profile.id}, include: {branches: true}});

    const overtimeTitles = await this.prisma.salary.groupBy({
      by: ['title'],
      where: {
        title: {startsWith: search?.title, mode: "insensitive"},
        datetime: search?.createdAt ? {
          in: search?.createdAt
        } : {
          gte: search?.startedAt,
          lte: search?.endedAt
        },
        type: {in: SalaryType.OVERTIME},
        payroll: {
          employee: {
            branch: acc.branches?.length
              ? {id: {in: profile?.branches.map(branch => branch.id)}}
              : {
                name: {
                  startsWith: search?.branch,
                  mode: "insensitive"
                }
              },
            position: {name: {startsWith: search?.position, mode: "insensitive"}},
            lastName: search?.type === SearchType.EQUALS
              ? {equals: search?.name, mode: "insensitive"}
              : search?.type === SearchType.START_WITH
                ? {startsWith: search?.name, mode: "insensitive"}
                : {contains: search?.name, mode: "insensitive"},
          }
        }
      },
    });
    const data = await Promise.all(overtimeTitles.map(async e => {
      const [total, salaries] = await Promise.all([
        this.prisma.salary.count({
          where: {
            title: {startsWith: e.title, mode: "insensitive"},
            type: {in: SalaryType.OVERTIME},
            datetime: search?.createdAt ? {
              in: search?.createdAt
            } : {
              gte: search?.startedAt,
              lte: search?.endedAt
            },
            payroll: {
              employee: {
                branch: acc.branches?.length
                  ? {id: {in: acc.branches.map(branch => branch.id)}}
                  : {name: {startsWith: search?.branch, mode: "insensitive"}}
              }
            }
          },
        }),
        this.prisma.salary.findMany({
          // take: Number(search?.take) || undefined,
          // skip: Number(search?.skip) || undefined,
          where: {
            title: {startsWith: e.title, mode: "insensitive"},
            type: {in: SalaryType.OVERTIME},
            datetime: search?.createdAt ? {
              in: search?.createdAt
            } : {
              gte: search?.startedAt,
              lte: search?.endedAt
            },
            payroll: {
              employee: {
                branch: acc.branches?.length
                  ? {id: {in: acc.branches.map(branch => branch.id)}}
                  : {name: {startsWith: search?.branch, mode: "insensitive"}}
              }
            }
          },
          include: {
            allowance: true,
            payroll: {
              include: {
                employee: {
                  include: {
                    branch: true,
                    position: true
                  }
                }
              }
            }
          },
          orderBy: {
            payroll: {
              employee: {
                stt: "asc"
              }
            }
          }
        })
      ]);
      /// TODO: Phân trang thì tổng sẽ lấy trong phạm vi được phân trang.
      return {total, salaries};
    }));

    return {
      total: data.map(e => e.total).reduce((a, b) => a + b, 0),
      data: data.map(e => e.salaries)
    };
  }

  async findOvertimesV3(profile: ProfileEntity, search: Partial<SearchPayrollDto>) {
    const acc = await this.prisma.account.findUnique({where: {id: profile.id}, include: {branches: true}});
    const [total, data] = await Promise.all([
      this.prisma.salary.count({
        where: {
          title: {startsWith: search?.title, mode: "insensitive"},
          type: {in: SalaryType.OVERTIME},
          datetime: search?.createdAt ? {
            in: search?.createdAt
          } : {
            gte: search?.startedAt,
            lte: search?.endedAt
          },
          payroll: {
            branch: acc.branches?.length
              ? {in: acc.branches.map(branch => branch.name)}
              : {startsWith: search?.branch, mode: "insensitive"},
            employee: {
              lastName: {contains: search?.name, mode: "insensitive"}
            }
          }
        },
      }),
      this.prisma.salary.findMany({
        take: search?.take,
        skip: search?.skip,
        where: {
          title: {startsWith: search?.title, mode: "insensitive"},
          type: {in: SalaryType.OVERTIME},
          datetime: search?.createdAt ? {
            in: search?.createdAt
          } : {
            gte: search?.startedAt,
            lte: search?.endedAt
          },
          payroll: {
            branch: acc.branches?.length
              ? {in: acc.branches.map(branch => branch.name)}
              : {startsWith: search?.branch, mode: "insensitive"},
            employee: {
              lastName: {contains: search?.name, mode: "insensitive"}
            }
          }
        },
        include: {
          allowance: true,
          payroll: {
            include: {
              employee: {
                include: {
                  branch: true,
                  position: true
                }
              }
            }
          }
        },
      })
    ]);
    return {total, data};
  }

  async findIds(createdAt: Date, employeeType?: EmployeeType, branchId?: number) {
    try {
      return await this.prisma.payroll.findMany({
        where: {
          employee: {
            branch: {id: {in: branchId}},
            type: {equals: employeeType || EmployeeType.FULL_TIME},
            leftAt: {in: null},
          },
          createdAt: {
            gte: firstDatetime(createdAt),
            lte: lastDatetime(createdAt),
          }
        },
        select: {id: true},
        orderBy: {
          employee: {
            stt: "asc"
          }
        }
      });
    } catch (err) {
      console.error(err);
      throw new BadRequestException(err);
    }
  }

  async overtimeTemplate(search: SearchSalaryDto) {
    return await this.prisma.salary.groupBy({
      by: ['title'],
      where: {
        type: {in: [SalaryType.OVERTIME]},
        datetime: {
          gte: search.startedAt,
          lte: search.endedAt,
        },
        payroll: {
          branch: search?.branch ? {startsWith: search.branch, mode: "insensitive"} : {},
          position: search?.position ? {startsWith: search.position, mode: "insensitive"} : {},
        }
      },
    });
  }

  async currentPayroll(profile: ProfileEntity, datetime: Date) {
    try {
      if (!datetime) {
        throw new BadRequestException("Vui lòng nhập tháng / năm để in phiếu chấm công. Xin cảm ơn!!!");
      }
      const employees = await this.prisma.employee.findMany({
        where: {
          branchId: profile?.branches?.length ? {in: profile?.branches.map(branch => branch.id)} : {},
        }
      });

      return await Promise.all(employees.map(async employee => {
        const payroll = await this.prisma.payroll.findFirst({
          where: {
            employeeId: employee.id,
            createdAt: {
              gte: firstDatetime(datetime),
              lte: lastDatetime(datetime),
            }
          },
          include: {
            salaries: true,
            employee: {
              include: {
                position: true,
                contracts: true,
              }
            },
          },
        });
        if (!payroll.accConfirmedAt) {
          throw `Cần xác nhận phiếu lương ${payroll.id} trước khi xuất`;
        }
        if (!payroll.salaries.filter(salary => salary.type === SalaryType.BASIC_INSURANCE).length) {
          throw `Phiếu lương ${payroll.id} chưa có lương cơ bản trích BH. Vui lòng thêm mục này để hoàn thành xác nhận.`;
        }
        return payroll;
      }));
    } catch (err) {
      console.error(err);
      throw new BadRequestException(err);
    }
  }


  async findCurrentHolidays(datetime: Date, positionId: Position["id"]) {
    try {
      return await this.prisma.holiday.findMany({
        where: {
          datetime: {
            gte: firstDatetime(datetime),
            lte: lastDatetime(datetime),
          },
          positions: {
            some: {id: {in: positionId}}
          },
        },
      });
    } catch (err) {
      console.error(err);
      throw new BadRequestException("Lỗi get current holiday", err);
    }
  }


}



