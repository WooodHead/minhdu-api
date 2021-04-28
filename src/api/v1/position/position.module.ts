import {Module} from "@nestjs/common";
import {PositionController} from "./position.controller";
import {PositionService} from "./position.service";
import {MongooseModule} from "@nestjs/mongoose";
import {ModelName} from "../../../common/constant/database.constant";
import {PositionSchema} from "./entities/position.entity";

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: ModelName.POSITION, schema: PositionSchema},
    ]),
  ],
  controllers: [PositionController],
  providers: [PositionService],
  exports: [PositionService]
})
export class PositionModule {
}
