import {Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards} from '@nestjs/common';
import {EmployeeService} from './employee.service';
import {CreateEmployeeDto} from './dto/create-employee.dto';
import {Roles} from "../../../core/decorators/roles.decorator";
import {UserType} from "../../../core/constants/role-type.constant";
import {ReqProfile} from "../../../core/decorators/req-profile.decorator";
import {UpdateEmployeeDto} from "./dto/update-employee.dto";
import {ApiV2Constant} from "../../../common/constant/api.constant";
import {GenderType} from '@prisma/client';
import {ParseDatetimePipe} from "../../../core/pipe/datetime.pipe";
import {CustomParseBooleanPipe} from 'src/core/pipe/custom-boolean.pipe';
import {JwtAuthGuard} from "../../../core/guard/jwt-auth.guard";
import {ApiKeyGuard} from "../../../core/guard/api-key-auth.guard";
import {RolesGuard} from "../../../core/guard/role.guard";
import {LoggerGuard} from "../../../core/guard/logger.guard";
import {ProfileEntity} from "../../../common/entities/profile.entity";

@UseGuards(JwtAuthGuard, ApiKeyGuard, RolesGuard)
@Controller(ApiV2Constant.EMPLOYEE)
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {
  }

  @UseGuards(LoggerGuard)
  @Roles(UserType.ADMIN, UserType.HUMAN_RESOURCE)
  @Post()
  create(@Body() createEmployeeDto: CreateEmployeeDto) {
    return this.employeeService.create(createEmployeeDto);
  }

  @Roles(UserType.ADMIN, UserType.HUMAN_RESOURCE, UserType.CAMP_ACCOUNTING)
  @Get()
  findAll(
    @ReqProfile() branchId: ProfileEntity,
    @Query("skip") skip: number,
    @Query("take") take: number,
    @Query("code") code: string,
    @Query("name") name: string,
    @Query("gender") gender: GenderType,
    @Query("createdAt", ParseDatetimePipe) createdAt: any,
    @Query("workedAt", ParseDatetimePipe) workedAt: any,
    @Query("isFlatSalary", CustomParseBooleanPipe) isFlatSalary: any,
    @Query("branch") branch: string,
    @Query("department") department: string,
    @Query("position") position: string,
  ) {
    return this.employeeService.findAll(branchId, skip, take, {
      code,
      name,
      gender,
      createdAt,
      workedAt,
      isFlatSalary,
      branch,
      department,
      position
    });
  }

  @Roles(UserType.ADMIN, UserType.HUMAN_RESOURCE, UserType.CAMP_ACCOUNTING)
  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.employeeService.findOne(+id);
  }

  @UseGuards(LoggerGuard)
  @Roles(UserType.ADMIN, UserType.HUMAN_RESOURCE)
  @Patch(':id')
  update(@Param('id') id: number, @Body() updateEmployeeDto: UpdateEmployeeDto) {
    return this.employeeService.update(+id, updateEmployeeDto);
  }

  @UseGuards(LoggerGuard)
  @Roles(UserType.ADMIN, UserType.HUMAN_RESOURCE)
  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.employeeService.remove(+id);
  }
}
