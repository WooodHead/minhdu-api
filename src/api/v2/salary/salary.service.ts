import {BadRequestException, Injectable} from "@nestjs/common";
import {Salary} from "@prisma/client";
import {firstDatetimeOfMonth, lastDatetimeOfMonth} from "../../../utils/datetime.util";
import {EmployeeService} from "../employee/employee.service";
import {PayrollService} from "../payroll/payroll.service";
import {CreateSalaryDto} from "./dto/create-salary.dto";
import {UpdateSalaryDto} from "./dto/update-salary.dto";
import {OneSalary} from "./entities/salary.entity";
import {SalaryRepository} from "./salary.repository";

@Injectable()
export class SalaryService {
  constructor(
    private readonly repository: SalaryRepository,
    private readonly employeeService: EmployeeService,
    private readonly payrollService: PayrollService
  ) {
  }

  async create(body: CreateSalaryDto): Promise<Salary | Salary[]> {
    const overtimes: Salary[] = [];
    /// Thêm phụ cấp tăng ca hàng loạt
    if (body.employeeIds && body.employeeIds.length) {
      // get all payroll in body.datetime for employee
      const payrolls = await Promise.all(
        body.employeeIds.map(async (employeeId) => {
          return await this.findPayrollByEmployee(employeeId, body.datetime as Date);
        })
      );

      for (let i = 0; i < payrolls.length; i++) {
        // Tạo overtime / absent trong payroll cho nhân viên
        //  Nếu body.allowEmpIds thì Thêm phụ cấp tiền ăn / phụ cấp trong giờ làm  tăng ca hàng loạt.  vì allowance đi chung với body nên cần dặt lại giá trị là null để nó khỏi gán cho nhân viên khác
        const salary = Object.assign(
          body,
          body.allowEmpIds?.includes(payrolls[i].employeeId)
            ? {
              payrollId: payrolls[i].id,
              allowance: body.allowance,
            }
            : {payrollId: payrolls[i].id, allowance: null}
        );

        overtimes.push(await this.repository.create(salary));
      }
      return overtimes;
    } else {
      /// get phụ cấp theo range ngày
      // const rageDate = (body as CreateSalaryByDayDto).datetime as RageDate;
      // if (!moment(rageDate?.start).isSame(rageDate?.end)) {
      //   const datetimes = getRange(rageDate?.start, rageDate?.end, "days");
      //   console.log(datetimes);
      // }
      return await this.repository.create(body);
    }
  }

  async findPayrollByEmployee(employeeId: number, datetime: Date) {
    // get payroll để lấy thông tin
    const payroll = await this.payrollService.findFirst({
      employeeId: employeeId,
      createdAt: {
        gte: firstDatetimeOfMonth(datetime),
        lte: lastDatetimeOfMonth(datetime),
      },
    });
    if (!payroll) {
      throw new BadRequestException(
        `Bảng lương tháng ${firstDatetimeOfMonth(datetime)} của mã nhân viên ${employeeId} không tồn tại. `
      );
    }
    return payroll;
  }

  //
  // findAll(employeeId: number, skip: number, take: number, search?: string) {
  //   return this.repository.findAll(employeeId, skip, take, search);
  // }

  findBy(employeeId: number, query: any): Promise<Salary[]> {
    throw new Error("Method not implemented.");
  }

  async findOne(id: number): Promise<OneSalary> {
    return await this.repository.findOne(id);
  }

  async update(id: number, updates: UpdateSalaryDto) {
    return await this.repository.update(id, updates);
  }

  async remove(id: number) {
    return this.repository.remove(id);
  }
}
