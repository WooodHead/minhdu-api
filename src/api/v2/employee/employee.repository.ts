import {
  BadRequestException,
  ConflictException,
  Injectable
} from "@nestjs/common";
import { ProfileEntity } from "../../../common/entities/profile.entity";
import { PrismaService } from "../../../prisma.service";
import { searchName } from "../../../utils/search-name.util";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { SearchEmployeeDto } from "./dto/search-employee.dto";
import { UpdateEmployeeDto } from "./dto/update-employee.dto";

@Injectable()
export class EmployeeRepository {
  constructor(private readonly prisma: PrismaService) {}

  x;

  async create(body: CreateEmployeeDto) {
    try {
      const position = await this.prisma.position.findUnique({
        where: { id: body.positionId },
      });

      return await this.prisma.employee.create({
        data: {
          firstName: body.firstName,
          lastName: body.lastName,
          gender: body.gender,
          phone: body.phone,
          workPhone: body.workPhone,
          birthday: body.birthday,
          birthplace: body.birthplace,
          identify: body.identify,
          idCardAt: body.idCardAt,
          issuedBy: body.issuedBy,
          ward: { connect: { id: body.wardId } },
          position: { connect: { id: body.positionId } },
          branch: { connect: { id: body.branchId } },
          address: body.address,
          religion: body.religion,
          workday: body.workday,
          mst: body.mst,
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
          position: { include: { branches: true } },
        },
      });
    } catch (err) {
      console.error(err);
      if (err?.response?.code === "P2002") {
        throw new ConflictException("CMND nhân viên đã tồn tại", err);
      } else {
        throw new BadRequestException(
          "Thêm nhân viên thất bại. Bạn đã tạo mới chức vụ hoặc đơn vị mới chưa. Vui lòng kiểm tra lại. ",
          err
        );
      }
    }
  }

  async count(): Promise<number> {
    return await this.prisma.employee.count();
  }

  async findAll(
    user: ProfileEntity,
    skip: number,
    take: number,
    search: Partial<SearchEmployeeDto>
  ) {
    try {
      const name = searchName(search?.name);

      const template = search?.templateId
        ? await this.prisma.overtimeTemplate.findUnique({
            where: { id: search?.templateId },
            include: { positions: true },
          })
        : null;
      const positionIds = template?.positions?.map((position) => position.id);

      const [total, data] = await Promise.all([
        this.prisma.employee.count({
          where: {
            leftAt: null,
            position: {
              name: { startsWith: search?.position, mode: "insensitive" },
            },
            positionId: { in: positionIds },
            code: { contains: search?.code, mode: "insensitive" },
            AND: {
              firstName: { contains: name?.firstName, mode: "insensitive" },
              lastName: { contains: name?.lastName, mode: "insensitive" },
            },
            gender: search?.gender ? { equals: search?.gender } : {},
            isFlatSalary: search?.isFlatSalary,
            createdAt: search?.createdAt,
            workedAt: search?.workedAt,
          },
        }),
        this.prisma.employee.findMany({
          skip: skip || undefined,
          take: take || undefined,
          where: {
            leftAt: null,
            positionId: { in: positionIds },
            code: { startsWith: search?.code, mode: "insensitive" },
            AND: {
              firstName: { startsWith: name?.firstName, mode: "insensitive" },
              lastName: { startsWith: name?.lastName, mode: "insensitive" },
            },
            gender: search?.gender ? { equals: search?.gender } : {},
            isFlatSalary: search?.isFlatSalary,
            createdAt: search?.createdAt,
            workedAt: search?.workedAt,
          },
          include: {
            position: true,
            branch: true,
            ward: {
              include: {
                district: {
                  include: { province: { include: { nation: true } } },
                },
              },
            },
          },
        }),
      ]);
      return { total, data };
    } catch (e) {
      console.error(e);
      throw new BadRequestException(e);
    }
  }

  async findBy(query: any) {
    return await this.prisma.employee.findMany({
      where: query,
      include: { payrolls: true },
    });
  }

  async findFirst(query: any) {
    return await this.prisma.employee.findFirst({
      where: query,
      include: { payrolls: true },
    });
  }

  async findOne(id: number) {
    try {
      return await this.prisma.employee.findUnique({
        where: { id: id },
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
          payrolls: true,
          historySalaries: true,
          workHistories: {
            include: {
              position: true,
              branch: true,
            },
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
      return await this.prisma.employee.update({
        where: { id: id },
        data: updates,
      });
    } catch (err) {
      console.error(err);
      throw new BadRequestException(err);
    }
  }

  /* Nghỉ việc */
  async remove(id: number) {
    try {
      await this.prisma.employee.update({
        where: { id },
        data: {
          leftAt: new Date(),
        },
      });
    } catch (err) {
      throw new BadRequestException(err);
    }
  }

  // updateQrCode(employeeId: number, qrCode: string) {
  //   this.prisma.employee.update({
  //     where: {id: employeeId},
  //     data: {qrCode}
  //   }).then();
  // }
}
