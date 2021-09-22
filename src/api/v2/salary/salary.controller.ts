import {Body, Controller, Delete, Get, Param, Patch, Post} from '@nestjs/common';
import {SalaryService} from './salary.service';
import {CreateSalaryDto, CreateSalaryEmployeesDto} from './dto/create-salary.dto';
import {UpdateSalaryDto} from "./dto/update-salary.dto";

@Controller('v2/salary')
export class SalaryController {
    constructor(private readonly salaryService: SalaryService) {
    }

    @Post()
    create(@Body() createSalaryDto: CreateSalaryDto & CreateSalaryEmployeesDto) {
        return this.salaryService.create(createSalaryDto);
    }

    // @Get()
    // findAll(
    //   @Query() employeeId: number,
    //   @Query("skip", ParseIntPipe) skip: number,
    //   @Query("take", ParseIntPipe) take: number,
    //   @Query("search") search: string,
    //   @Query("datetime") datetime: Date,
    // ) {
    //   return this.salaryService.findAll();
    // }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.salaryService.findOne(+id);
    }


    @Patch(':id')
    update(@Param('id') id: string, @Body() updateSalaryDto: UpdateSalaryDto) {
        return this.salaryService.update(+id, updateSalaryDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.salaryService.remove(+id);
    }
}
