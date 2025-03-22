import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CreatorsController } from "./creators.controller";
import { CreatorsService } from "./creators.service";
import { User, Payment } from "../../entities";

@Module({
  imports: [TypeOrmModule.forFeature([User, Payment])],
  controllers: [CreatorsController],
  providers: [CreatorsService],
  exports: [CreatorsService],
})
export class CreatorsModule {}
