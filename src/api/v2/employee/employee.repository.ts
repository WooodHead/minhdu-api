import {BadRequestException, ConflictException, Injectable,} from "@nestjs/common";
import {ProfileEntity} from "../../../common/entities/profile.entity";
import {PrismaService} from "../../../prisma.service";
import {CreateEmployeeDto} from "./dto/create-employee.dto";
import {SearchEmployeeDto} from "./dto/search-employee.dto";
import {UpdateEmployeeDto} from "./dto/update-employee.dto";
import {firstDatetime, lastDatetime} from "../../../utils/datetime.util";
import {EmployeeType} from "@prisma/client";
import {SearchEmployeeByOvertimeDto} from "./dto/search-employee-by-overtime.dto";

@Injectable()
export class EmployeeRepository {
  constructor(private readonly prisma: PrismaService) {
  }

  async create(body: CreateEmployeeDto) {
    try {
      const position = await this.prisma.position.findUnique({
        where: {id: body.positionId},
      });

      // Nếu tạo nhân viên có workday thuộc position này nhưng khác ngày công chuẩn thì cập nhật lại ngày công chuẩn cho position đó
      await this.prisma.position.update({
        where: {id: body.positionId},
        data: {workday: body.workday},
      });
      return await this.prisma.employee.create({
        data: {
          lastName: body.lastName,
          gender: body.gender,
          phone: body.phone,
          workPhone: body.workPhone,
          birthday: body.birthday,
          birthplace: body.birthplace,
          identify: body.identify,
          idCardAt: body.idCardAt,
          issuedBy: body.issuedBy,
          workday: body.workday,
          ward: {connect: {id: body.wardId}},
          address: body.address,
          email: body.email,
          religion: body.religion,
          mst: body.mst,
          createdAt: body.createdAt,
          workedAt: body.workedAt,
          isFlatSalary: body.isFlatSalary,
          position: {connect: {id: body.positionId}},
          note: body.note,
          branch: {connect: {id: body.branchId}},
          recipeType: body.recipeType,
          type: body.type,
          contracts: body.contract?.createdAt
            ? {
              create: {
                createdAt: body.contract.createdAt,
                expiredAt: body.contract.expiredAt,
                position: position.name,
              },
            }
            : {},
        },
        include: {
          position: true,
          branch: true,
        },
      });
    } catch (err) {
      console.error(err);
      if (err?.response?.code === "P2002") {
        throw new ConflictException(
          "Nhân viên đã nghỉ việc. Hồ sơ nhân viên đã có trên hệ thống. Vui lòng liên hệ admin để khôi phục tài khoản",
          err
        );
      } else {
        throw new BadRequestException(
          "Thêm nhân viên thất bại. Bạn đã tạo mới chức vụ hoặc đơn vị mới chưa. Vui lòng kiểm tra lại. ",
          err
        );
      }
    }
  }

  async findAll(
    profile: ProfileEntity,
    skip: number,
    take: number,
    search: Partial<SearchEmployeeDto>
  ) {
    try {
      const template = search?.templateId
        ? await this.prisma.overtimeTemplate.findUnique({
          where: {id: search?.templateId},
          include: {positions: true},
        })
        : null;
      const positionIds = template?.positions?.map((position) => position.id);

      const [total, data] = await Promise.all([
        this.prisma.employee.count({
          where: {
            leftAt: search?.isLeft ? {notIn: null} : {in: null},
            position: {
              name: {startsWith: search?.position, mode: "insensitive"},
            },
            branch: {
              id: profile.branches?.length ? {in: profile.branches.map(branch => branch.id)} : {},
              name: !profile.branches?.length ? {startsWith: search?.branch, mode: "insensitive"} : {},
            },
            positionId: positionIds?.length ? {in: positionIds} : {},
            lastName: {contains: search?.name, mode: "insensitive"},
            gender: search?.gender ? {equals: search?.gender} : {},
            isFlatSalary: search?.isFlatSalary,
            createdAt: search?.createdAt ? search?.createdAt.compare === 'gte' ? {
              gte: search?.createdAt?.datetime,
            } : search?.createdAt.compare === 'lte' ? {
              lte: search?.createdAt?.datetime,
            } : {in: search?.createdAt?.datetime} : {},
            workedAt: search?.workedAt,
            payrolls: search?.createdPayroll ? {
              some: {
                createdAt: {
                  gte: firstDatetime(search?.createdPayroll),
                  lte: lastDatetime(search?.createdPayroll)
                }
              }
            } : {},
            type: {equals: search?.type || EmployeeType.FULL_TIME},
            recipeType: search?.recipeType ? {in: search?.recipeType} : {},
            ward: {
              name: {startsWith: search?.ward, mode: "insensitive"},
              district: {
                name: {startsWith: search?.district, mode: "insensitive"},
                province: {
                  name: {startsWith: search?.province, mode: "insensitive"}
                }
              }
            }
          },
        }),
        this.prisma.employee.findMany({
          skip: skip || undefined,
          take: take || undefined,
          where: {
            leftAt: search?.isLeft ? {notIn: null} : {in: null},
            position: {
              name: {startsWith: search?.position, mode: "insensitive"},
            },
            branch: {
              id: profile.branches?.length ? {in: profile.branches.map(branch => branch.id)} : {},
              name: !profile.branches?.length ? {startsWith: search?.branch, mode: "insensitive"} : {},
            },
            positionId: positionIds?.length ? {in: positionIds} : {},
            lastName: {contains: search?.name, mode: "insensitive"},
            gender: search?.gender ? {equals: search?.gender} : {},
            isFlatSalary: search?.isFlatSalary,
            createdAt: search?.createdAt ? search?.createdAt.compare === 'gte' ? {
              gte: search?.createdAt?.datetime,
            } : search?.createdAt.compare === 'lte' ? {
              lte: search?.createdAt?.datetime,
            } : {
              gte: firstDatetime(search?.createdAt?.datetime),
              lte: lastDatetime(search?.createdAt?.datetime)
            } : {},
            workedAt: search?.workedAt,
            payrolls: search?.createdPayroll ? {
              some: {
                createdAt: {
                  gte: firstDatetime(search?.createdPayroll),
                  lte: lastDatetime(search?.createdPayroll)
                }
              }
            } : {},
            type: {equals: search?.type || EmployeeType.FULL_TIME},
            recipeType: search?.recipeType ? {in: search?.recipeType} : {},
            ward: {
              name: {startsWith: search?.ward, mode: "insensitive"},
              district: {
                name: {startsWith: search?.district, mode: "insensitive"},
                province: {
                  name: {startsWith: search?.province, mode: "insensitive"}
                }
              }
            }
          },
          include: {
            position: true,
            branch: true,
            ward: {
              include: {
                district: {
                  include: {province: {include: {nation: true}}},
                },
              },
            },
          },
        }),
      ]);
      return {total, data};
    } catch (e) {
      console.error(e);
      throw new BadRequestException(e);
    }
  }

  async findEmployeesByOvertime(profile: ProfileEntity, search: SearchEmployeeByOvertimeDto) {
    if (!(search?.title || search?.times || search?.datetime || search?.unit)) {
      throw new BadRequestException(`[DEVELOPMENT] {title, times, datetime, unit} NOT NULL `);
    }

    return await this.prisma.salary.findMany({
      where: {
        datetime: {in: search.datetime},
        title: search.title,
        unit: search.unit,
        times: search.times,
        branch: {
          id: profile.branches?.length ? {in: profile.branches.map(branch => branch.id)} : {},
        },
      },
      include: {
        payroll: {
          select: {
            employee: {
              select: {
                id: true,
                lastName: true,
                position: true,
              }
            }
          }
        }
      }
    });
  }


  async findBy(query: any) {
    return await this.prisma.employee.findMany({
      where: query,
      include: {payrolls: true},
    });
  }

  async findFirst(query: any) {
    return await this.prisma.employee.findFirst({
      where: query,
      include: {payrolls: true},
    });
  }

  async findOne(id: number) {
    try {
      return await this.prisma.employee.findUnique({
        where: {id: id},
        include: {
          degrees: true,
          contracts: true,
          relatives: {
            include: {
              ward: {
                include: {
                  district: {
                    include: {
                      province: {
                        include: {
                          nation: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          banks: true,
          position: true,
          branch: true,
          ward: {
            include: {
              district: {
                include: {
                  province: {
                    include: {
                      nation: true,
                    },
                  },
                },
              },
            },
          },
          salaryHistories: true,
          workHistories: {
            select: {
              branch: {select: {name: true}},
              position: {select: {name: true}},
              createdAt: true
            }
          },
        },
      });
    } catch (e) {
      console.error(e);
      throw new BadRequestException(e);
    }
  }

  async update(id: number, updates: UpdateEmployeeDto) {
    try {
      const employee = await this.prisma.employee.update({
        where: {id: id},
        data: {
          lastName: updates.lastName,
          gender: updates.gender,
          phone: updates.phone,
          workPhone: updates.workPhone,
          birthday: updates.birthday,
          birthplace: updates.birthplace,
          identify: updates.identify,
          idCardAt: updates.idCardAt,
          issuedBy: updates.issuedBy,
          ward: updates?.wardId ? {connect: {id: updates.wardId}} : {},
          position: updates?.positionId ? {connect: {id: updates.positionId}} : {},
          branch: updates?.branchId ? {connect: {id: updates.branchId}} : {},
          address: updates.address,
          religion: updates.religion,
          workday: updates.workday,
          mst: updates.mst,
          email: updates.email,
          zalo: updates.zalo,
          facebook: updates.facebook,
          avt: updates.avt,
          ethnicity: updates.ethnicity,
          createdAt: updates.createdAt,
          workedAt: updates.workedAt,
          isFlatSalary: updates.isFlatSalary,
          recipeType: updates.recipeType,
          note: updates.note,
          type: updates.type,
        },
        include: {
          degrees: true,
          contracts: true,
          relatives: {
            include: {
              ward: {
                include: {
                  district: {
                    include: {
                      province: {
                        include: {
                          nation: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          banks: true,
          position: true,
          branch: true,
          ward: {
            include: {
              district: {
                include: {
                  province: {
                    include: {
                      nation: true,
                    },
                  },
                },
              },
            },
          },
          salaryHistories: true,
          workHistories: {
            select: {
              branch: {select: {name: true}},
              position: {select: {name: true}},
              createdAt: true
            }
          },
        },
      });
      if (updates.positionId || updates.branchId) {
        this.prisma.workHistory.create({
          data: {
            positionId: employee.positionId,
            branchId: employee.branchId,
            employeeId: employee.id,
          }
        }).then();
      }
      return employee;
    } catch (err) {
      console.error(err);
      throw new BadRequestException(err);
    }
  }

  /* Nghỉ việc */
  async leave(id: number, leftAt: Date) {
    try {
      return await this.prisma.employee.update({
        where: {id},
        data: {
          leftAt: leftAt || null,
        },
      });
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.employee.delete({where: {id}});
    } catch (err) {
      console.error(err);
      throw new BadRequestException(err);
    }
  }
}
