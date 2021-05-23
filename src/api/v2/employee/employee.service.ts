import {BadRequestException, ConflictException, Injectable, NotFoundException} from '@nestjs/common';
import {CreateEmployeeDto} from './dto/create-employee.dto';
import {UpdateEmployeeDto} from './dto/update-employee.dto';
import {PrismaService} from "../../../prisma.service";
import {SalaryService} from "../salary/salary.service";
import {SalaryType} from '@prisma/client';
import {Promise} from "mongoose";
import {CreateSalaryDto} from "../salary/dto/create-salary.dto";

const qr = require("qrcode");

@Injectable()
export class EmployeeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly salaryService: SalaryService,
  ) {
  }

  include = {
    branch: true,
    department: true,
    position: true
  }

  selectEmployee = {
    id: true,
    name: true,
    position: {
      select: {
        id: true,
        name: true,
      }
    },
    department: {
      select: {
        id: true,
        name: true
      }
    },
    payrolls: {
      select: {
        id: true,
        paidAt: true,
        salaries: true,
      }
    },
    isFlatSalary: true,
  }

  /**
   * Thêm thông tin nhân viên và lương căn bản ban đầu
   * */
  async create(body: CreateEmployeeDto) {
    const bodySalary = new CreateSalaryDto();
    bodySalary.title = 'Lương cơ bản trích BH';
    bodySalary.price = body.price;
    bodySalary.type = SalaryType.BASIC;
    bodySalary.note = body.note;
    try {
      const salary = await this.salaryService.create(bodySalary);

      return await this.prisma.employee.create({
        data: {
          id: await this.generateEmployeeCode(body),
          identify: body.identify,
          name: body.name,
          address: body.address,
          salaries: {
            connect: {id: salary.id}
          },
          workedAt: new Date(body.workedAt).toISOString(),
          branch: {connect: {id: body.branchId}},
          department: {connect: {id: body.departmentId}},
          position: {connect: {id: body.positionId}},
          phone: body.phone,
          birthday: new Date(body.birthday).toISOString(),
          gender: body.gender,
          note: body.note,
          payrolls: {
            create: {
              salaries: {
                connect: {id: salary.id}
              }
            }
          }
        },
        include: this.include
      });
    } catch (e) {
      console.error(e);
      if (e?.code == "P2025") {
        throw new NotFoundException(`Không tìm thấy id ${body?.branchId} hoặc ${body?.departmentId} hoặc ${body?.positionId}. Chi tiết: ${e?.meta?.cause}`);
      } else if (e?.code == "P2002") {
        throw new ConflictException(`CMND không được giống nhau. Vui lòng kiểm tra lại. Chi tiết: ${e}`);
      } else if (e?.code == "P2014") {
        throw new BadRequestException(`Chi nhánh ${body.branchId} không tồn tại phòng ban ${body.departmentId} hoặc phòng ban ${body.departmentId} không tồn tại chức vụ ${body.positionId}. Vui lòng kiểm tra lại. Chi tiết: ${e?.meta}`);
      } else {
        throw new BadRequestException(e);
      }
    }
  }

  async findAll(skip: number, take: number, search?: string): Promise<any> {

    const [total, data] = await Promise.all([
      this.prisma.employee.count(),
      this.prisma.employee.findMany({
        skip,
        take,
        include: {
          branch: true,
          department: true,
          position: true
        }
      }),
    ]);

    return {total, data};
  }

  // async findAll(skip: number, take: number, search?: string): Promise<any> {
  //   let data = [];
  //   let workDay: number;
  //   let actualDay: number = new Date().getDate();
  //
  //   if (isNaN(skip) || isNaN(take)) {
  //     skip = 0;
  //     take = 10;
  //   }
  //   try {
  //     const total = await this.prisma.employee.count();
  //     const employees = await this.findEmployees(skip, take, search);
  //
  //     for (let i = 0; i < employees.length; i++) {
  //       workDay = (await this.workDay(employees[i].department.id, employees[i].position.id)).workday;
  //       let payrolls = employees[i].payrolls;
  //
  //       if (payrolls.length === 0) {
  //         payrolls = await this.payrollService.create(employees[i].id);
  //       }
  //
  //       if (payrolls?.length === 1) {
  //         actualDay = this.actualDay(payrolls[0]);
  //       }
  //
  //       data.push({
  //         id: employees[i].id,
  //         name: employees[i].name,
  //         gender: employees[i].gender,
  //         birthday: employees[i].birthday,
  //         phone: employees[i].phone,
  //         workedAt: employees[i].workedAt,
  //         leftAt: employees[i].leftAt,
  //         idCardAt: employees[i].idCardAt,
  //         address: employees[i].address,
  //         certificate: employees[i].certificate,
  //         stayedAt: employees[i].stayedAt,
  //         contractAt: employees[i].contractAt,
  //         note: employees[i].note,
  //         qrcode: employees[i].qrCode,
  //         isFlatSalary: employees[i].isFlatSalary,
  //         branch: employees[i].branch,
  //         department: employees[i].department,
  //         position: employees[i].position,
  //         payrolls: employees[i].payrolls,
  //         workDay,
  //         actualDay
  //       });
  //     }
  //
  //     return {
  //       total,
  //       data
  //     };
  //   } catch (e) {
  //     console.error(e);
  //     throw new InternalServerErrorException(`Các tham số skip, take, id là bắt buộc. Vui lòng kiểm tra lại bạn đã truyền đủ 3 tham số chưa.?. Chi tiết: ${e}`);
  //   }
  // }

  async findOne(id: string) {
    let actualDay: number = new Date().getDate();

    const employee = await this.prisma.employee.findUnique({
      where: {id: id},
      include: {
        branch: true,
        department: true,
        position: true,
        payrolls: true,
      }
    });

    const workDay = await this.workDay(employee.department.id, employee.position.id);

    const payrolls = employee?.payrolls?.filter(payroll => payroll.paidAt === null);


    return {
      id: employee.id,
      name: employee.name,
      gender: employee.gender,
      birthday: employee.birthday,
      phone: employee.phone,
      workedAt: employee.workedAt,
      leftAt: employee.leftAt,
      idCardAt: employee.idCardAt,
      address: employee.address,
      certificate: employee.certificate,
      stayedAt: employee.stayedAt,
      contractAt: employee.contractAt,
      note: employee.note,
      qrcode: employee.qrCode,
      isFlatSalary: employee.isFlatSalary,
      branch: employee.branch,
      department: employee.department,
      position: employee.position,
      payrolls: employee.payrolls,
      workDay: workDay.workday,
      actualDay
    };
  }

  async update(id: string, updates: UpdateEmployeeDto) {
    return await this.prisma.branch.update({where: {id: id}, data: updates})
      .catch((e) => new BadRequestException(e));

  }

  async remove(id: string) {
    await this.prisma.branch.delete({where: {id: id}}).catch((e) => {
      throw new BadRequestException(e);
    });
  }

  async generateEmployeeCode(body: CreateEmployeeDto): Promise<string> {
    const count = await this.prisma.employee.count();
    let gen: string;
    if (count < 10) {
      gen = "000";
    } else if (count < 100) {
      gen = "00";
    } else if (count < 1000) {
      gen = "0";
    }
    const id = `${body.branchId}${gen}${count + 1}`;
    this.updateQrCodeEmployee(id).then();
    return id;
  }

  async updateQrCodeEmployee(id: string) {
    const qrCode = await qr.toDataURL(id);
    await this.prisma.employee.update({
      where: {id: id},
      data: {qrCode: qrCode}
    });

  }

  async findEmployees(skip: number, take: number, search: string): Promise<any> {
    const date = new Date(), y = date.getFullYear(), m = date.getMonth();
    const firstDay = new Date(y, m, 1);
    const lastDay = new Date(y, m + 1, 0);

    const include = {
      branch: {
        select: {
          id: true,
          name: true,
        }
      },
      department: {
        select: {
          id: true,
          name: true,
        }
      },
      position: {
        select: {
          id: true,
          name: true,
        }
      },
      payrolls: {
        where: {
          createdAt: {lte: lastDay, gte: firstDay}
        }
      }
    };

    const searchName = {name: {startsWith: search}};

    if (search == '' || search === undefined || search === null) {
      return await this.prisma.employee.findMany({skip, take, include: include});
    } else {
      let employees = await this.prisma.employee.findMany({
        skip,
        take,
        where: searchName,
        include: include,
      });

      if (employees.length === 0) {
        employees = await this.prisma.employee.findMany({
          skip,
          take,
          where: {branch: searchName},
          include: include
        });
      }

      if (employees.length === 0) {
        employees = await this.prisma.employee.findMany({
          skip,
          take,
          where: {department: searchName},
          include: include
        });
      }
      return employees;
    }

  }

  async findEmployee(skip: number, take: number, search?: string) {
    return await this.prisma.employee.findMany({
      skip: skip,
      take: take,
      where: {
        name: {startsWith: search}
      },
      select: this.selectEmployee
    });
  }

  async workDay(departmentId, positionId): Promise<{ workday: number }> {
    return await this.prisma.departmentToPosition.findUnique({
      where: {
        departmentId_positionId: {
          departmentId: departmentId,
          positionId: positionId,
        }
      },
      select: {workday: true}
    });
  }
}
