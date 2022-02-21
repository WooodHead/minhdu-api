import {Body, Controller, Delete, Get, Param, Patch, Post, Query} from '@nestjs/common';
import {ImportExportService} from './import-export.service';
import {CreateImportExportDto} from './dto/create-import-export.dto';
import {UpdateImportExportDto} from './dto/update-import-export.dto';
import {SearchImportExportDto} from "./dto/search-import-export.dto";

@Controller('v2/import-export')
export class ImportExportController {
  constructor(private readonly importExportService: ImportExportService) {
  }

  @Post()
  create(@Body() createImportExportDto: CreateImportExportDto) {
    return this.importExportService.create(createImportExportDto);
  }

  @Get()
  findAll(@Query() search: SearchImportExportDto) {
    return this.importExportService.findAll(search);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.importExportService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateImportExportDto: UpdateImportExportDto) {
    return this.importExportService.update(+id, updateImportExportDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.importExportService.remove(+id);
  }
}
