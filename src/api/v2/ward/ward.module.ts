import {Module} from '@nestjs/common';
import {WardService} from './ward.service';
import {WardController} from './ward.controller';
import {PrismaService} from "../../../prisma.service";
import {WardRepository} from "./ward.repository";

@Module({
  controllers: [WardController],
  providers: [PrismaService, WardService, WardRepository]
})
export class WardModule {
}