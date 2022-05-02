import {Body, Controller, Get, Param, Post, UseGuards} from '@nestjs/common';
import {AllowanceService} from './allowance.service';
import {CreateAllowanceDto} from './dto/create-allowance.dto';
import {UpdateAllowanceDto} from './dto/update-allowance.dto';
import {RemoveManyAllowanceDto} from "./dto/remove-many-allowance.dto";
import {ApiKeyGuard, JwtAuthGuard, RolesGuard} from "../../../../core/guard";
import {Roles} from "../../../../core/decorators/roles.decorator";
import {RoleEnum} from "@prisma/client";
import {CreateManyAllowanceDto} from "./dto/create-many-allowance.dto";

@UseGuards(JwtAuthGuard, ApiKeyGuard, RolesGuard)
@Controller('v2/salary/allowance')
export class AllowanceController {
  constructor(private readonly allowanceService: AllowanceService) {
  }

  @Roles(RoleEnum.SUPPER_ADMIN, RoleEnum.CAMP_ACCOUNTING)
  @Post("multiple/creation")
  createMany(@Body() body: CreateManyAllowanceDto) {
    return this.allowanceService.createMany(body);
  }

  @Roles(RoleEnum.SUPPER_ADMIN, RoleEnum.ADMIN, RoleEnum.HUMAN_RESOURCE, RoleEnum.CAMP_ACCOUNTING)
  @Get()
  findAll() {
    return this.allowanceService.findAll();
  }

  @Roles(RoleEnum.SUPPER_ADMIN, RoleEnum.ADMIN, RoleEnum.HUMAN_RESOURCE, RoleEnum.CAMP_ACCOUNTING)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.allowanceService.findOne(+id);
  }

  @Roles(RoleEnum.SUPPER_ADMIN, RoleEnum.CAMP_ACCOUNTING)
  @Post("multiple/updation")
  updateMany(@Body() body: UpdateAllowanceDto) {
    return this.allowanceService.updateMany(body);
  }

  @Roles(RoleEnum.SUPPER_ADMIN, RoleEnum.CAMP_ACCOUNTING)
  @Post("multiple/deletion")
  removeMany(@Body() body: RemoveManyAllowanceDto) {
    return this.allowanceService.removeMany(body);
  }
}