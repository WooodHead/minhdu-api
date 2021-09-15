import {BadRequestException, ConflictException, Injectable} from "@nestjs/common";
import {DatetimeUnit, Salary, SalaryType} from "@prisma/client";
import * as moment from "moment";
import {firstMonth, lastDayOfMonth, lastMonth} from "../../../utils/datetime.util";
import {EmployeeService} from "../employee/employee.service";
import {BasePayrollService} from "./base-payroll.service";
import {CreatePayrollDto} from "./dto/create-payroll.dto";
import {UpdatePayrollDto} from "./dto/update-payroll.dto";
import {PayrollRepository} from "./payroll.repository";
import {SearchPayrollDto} from "./dto/search-payroll.dto";

@Injectable()
export class PayrollService implements BasePayrollService {
  constructor(
    private readonly repository: PayrollRepository,
    private readonly employeeService: EmployeeService,
  ) {
  }

  async checkCurrentExist(date: Date, employeeId: number): Promise<boolean> {
    const first = firstMonth(date);
    const last = lastMonth(date);

    const payroll = await this.repository.findMany({
      first,
      last,
      employeeId: employeeId,
    });
    return payroll !== null;
  }

  async create(body: CreatePayrollDto) {
    try {
      const exist = await this.checkCurrentExist(
        body.createdAt,
        body.employeeId
      );
      if (exist) {
        throw new ConflictException(
          `Phiếu lương tháng ${moment(body.createdAt).format(
            "MM/yyyy"
          )} đã tồn tại.. Vui lòng kiểm tra kỹ lại trước khi thêm.. Tức cái lồng ngực á`
        );
      }
      const payroll = await this.repository.create(body);
      if (payroll) {
        this.employeeService.findOne(payroll.employeeId).then((payroll) => {
          payroll?.salaries?.map((salary) => {
            this.update(payroll.id, {salaryId: salary.id}).then();
          });
        });
      }
      return payroll;
    } catch (err) {
      console.error(err);
      throw new ConflictException(err);
    }
  }

  /*
   * Kiểm tra phiếu lương của từng nhân viên đã tồn tại trong tháng này chưa?. Nếu chưa thì sẽ khởi tạo. Sau khi khởi
   * tạo xong hết danh sách nhân viên thì sẽ trả về true
   * */
  async generatePayroll(branchId: number): Promise<boolean> {
    try {
      const employees = await this.employeeService.findBy({
        position: {department: {branch: {id: branchId}}},
      });

      for (let i = 0; i < employees.length; i++) {
        const exist = await this.checkCurrentExist(new Date(), employees[i].id);

        if (!exist) {
          await this.repository.create({
            employeeId: employees[i].id,
            salaries: employees[i].salaries,
            createdAt: new Date(),
          });
        }
      }
      return true;
    } catch (err) {
      console.error(err);
      throw new BadRequestException(err);
    }
  }

  // @ts-ignore
  async findAll(
    branchId: number,
    skip: number,
    take: number,
    search?: Partial<SearchPayrollDto>,
  ) {
    const checkExist = await this.generatePayroll(branchId);
    if (checkExist) {
      const res = await this.repository.findAll(branchId, skip, take, search);
      const data = res?.data?.map((payroll) => {
        return {
          id: payroll.id,
          accConfirmedAt: payroll.accConfirmedAt,
          manConfirmedAt: payroll.manConfirmedAt,
          paidAt: payroll.paidAt,
          createdAt: payroll.createdAt,
          employee: payroll.employee,
        };
      });
      return {
        total: res.total,
        data,
      };
    } else {
      throw new BadRequestException(
        "Có Lỗi xảy ra ở payroll service. Vui lòng liên hệ developer để khắc phục. Xin cảm ơn"
      );
    }
  }

  async findOne(id: number): Promise<any> {
    const res = await this.repository.findOne(id);
    return {
      id: res.id,
      accConfirmedAt: res.accConfirmedAt,
      manConfirmedAt: res.manConfirmedAt,
      paidAt: res.paidAt,
      createdAt: res.createdAt,
      salaries: res.salaries,
      employee: res.employee,
      payslip:
        res.manConfirmedAt !== null && res.salaries.length !== 0
          ? this.totalSalary(res)
          : null,
    };
  }

  findBy(query: any) {
    return this.repository.findBy(query);
  }

  findFirst(query: any) {
    return this.repository.findFirst(query);
  }

  /*
   * - Front end sẽ thêm salary mới và gửi id salary lên để connect vào phiếu lương
   *     + Nếu id salary thuộc type BASIC hoặc ALLOWANCE_STAYED thì sẽ được connect thêm tới lương của nhân viên
   *     + Ngược lại sẽ chỉ connect cho payroll
   * - Chặn edit phiếu lương sau khi phiếu lương đã xác nhận
   * - Quản lý xác phiếu lương,
   * - Quỹ Xác nhận đã thanh toán phiếu lương
   * */
  async update(id: number, updates: UpdatePayrollDto) {
    const payroll = await this.findOne(id);
    if (payroll.isEdit) {
      throw new BadRequestException(
        "Phiếu lương đã được tạo vì vậy bạn không có quyền sửa. Vui lòng liên hệ admin để được hỗ trợ."
      );
    }

    if (updates.accConfirmedAt) {
      updates.accConfirmedAt = new Date(updates.accConfirmedAt);
    }

    if (updates.manConfirmedAt) {
      updates.manConfirmedAt = new Date(updates.manConfirmedAt);
    }

    if (updates.paidAt) {
      updates.paidAt = new Date(updates.paidAt);
    }
    return await this.repository.update(id, updates);
  }

  async remove(id: number) {
    return this.repository.remove(id);
  }

  totalAbsent(salaries: Salary[]) {
    let absent = 0;
    let late = 0;

    for (let i = 0; i < salaries.length; i++) {
      switch (salaries[i].type) {
        case SalaryType.ABSENT:
          if (salaries[i].unit === DatetimeUnit.DAY) {
            if (salaries[i].forgot) {
              absent += salaries[i].times * 1.5;
            } else {
              absent += salaries[i].times;
            }
          } else {
            late += salaries[i].times;
          }

          break;
      }
    }
    return absent + late;
  }

  /*
   * Tổng lương: result
   * Ngày làm thực tế: actual
   * Ngày công chuẩn: workday
   * Tổng lương cơ bản: basics
   * Tổng phụ cấp ở lại: stays
   * Tổng phụ cấp khác: allowances
   * Lương cố định: isFlat
   * Tổng ngày vắng: absents
   *
   * 1. actual > workday                  => result = (basics / workday) x actual + stays + allowances
   * 2. actual < workday                  => result = [(basics + stays) / workday] x actual + allowances
   * 3. isFlat === true && absents !== 0  => actual = workday (Dù tháng đó có bao nhiêu ngày đi chăng nữa). else quay lại 1 & 2
   * */
  totalSalary(payroll: any) {
    let basicSalary = 0;
    let tax = 0;
    let staySalary = 0;
    let allowanceSalary = 0;
    let overtime = 0;
    let absentTime = 0;
    let lateTime = 0;
    let daySalary = 0;
    let total = 0;
    /*
     * Nếu tháng này nghỉ ngang thì sẽ lấy ngày hôm nay (lúc lập phiếu lương)*/
    let actualDay =
      (!payroll.isEdit
        ? new Date().getDate()
        : lastDayOfMonth(payroll.createdAt)) -
      this.totalAbsent(payroll.salaries);

    if (
      payroll.employee.isFlatSalary &&
      this.totalAbsent(payroll.salaries) === 0
    ) {
      actualDay = 30;
    }

    for (let i = 0; i < payroll.salaries.length; i++) {
      switch (payroll.salaries[i].type) {
        case SalaryType.BASIC:
          basicSalary += payroll.salaries[i].price;
          break;
        case SalaryType.STAY:
          staySalary += payroll.salaries[i].price;
          break;
        case SalaryType.ALLOWANCE:
          if (
            payroll.salaries[i].times === null &&
            payroll.salaries.datetime === null
          ) {
            payroll.salaries[i].times = 1;
          }
          allowanceSalary +=
            payroll.salaries[i].times * payroll.salaries[i].price;
          break;
        case SalaryType.OVERTIME:
          /*
           * Nếu lương x2 thì tính thêm 1 ngày vì ngày hiện tại vẫn đi làm*/
          overtime += payroll.salaries[i].rate - 1;
          break;
        case SalaryType.ABSENT:
          if (payroll.salaries[i].unit === DatetimeUnit.HOUR) {
            lateTime += payroll.salaries[i].times;
          }
          break;
      }
    }
    if (actualDay >= payroll.employee.position.workday) {
      daySalary = basicSalary / payroll.employee.position.workday;
    } else {
      daySalary =
        (basicSalary + staySalary) / payroll.employee.position.workday;
    }

    const basic = payroll.salaries.find(
      (salary) => salary.type === SalaryType.BASIC_ISNURANCE
    );
    if (basic !== undefined) {
      tax = payroll.employee.contracts !== 0 ? basic.price * 0.115 : 0;
    }

    const deduction = (daySalary / 8) * lateTime + daySalary * absentTime;
    const allowanceOvertime = daySalary * overtime;

    if (actualDay >= payroll.employee.position.workday) {
      total =
        daySalary * actualDay +
        allowanceSalary +
        allowanceOvertime +
        staySalary -
        tax;
    } else {
      total = daySalary * actualDay + allowanceSalary + allowanceOvertime - tax;
    }
    return {
      basic: Math.ceil(basicSalary),
      stay: Math.ceil(staySalary),
      allowance: Math.ceil(allowanceSalary + allowanceOvertime),
      deduction,
      daySalary,
      actualDay,
      workday: payroll.employee.position.workday,
      salaryActual: Math.ceil(daySalary * actualDay),
      tax,
      total: Math.round(total / 1000) * 1000,
    };
  }
}
