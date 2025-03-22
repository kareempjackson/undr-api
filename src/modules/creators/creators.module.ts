import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CreatorsController } from "./creators.controller";
import { CreatorsService } from "./creators.service";
import { User, Payment } from "../../entities";
import { CommonModule } from "../common/common.module";

@Module({
  imports: [TypeOrmModule.forFeature([User, Payment]), CommonModule],
  controllers: [CreatorsController],
  providers: [CreatorsService],
  exports: [CreatorsService],
})
export class CreatorsModule {}
