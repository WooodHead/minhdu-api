import {Module} from '@nestjs/common';
import {RelativeService} from './relative.service';
import {RelativeController} from './relative.controller';
import {RelativeRepository} from "./relative.repository";
import {PrismaService} from "../../../prisma.service";

@Module({
  controllers: [RelativeController],
  providers: [PrismaService, RelativeService, RelativeRepository]
})
export class RelativeModule {
}
