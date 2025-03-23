import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { SecurityModule } from "../modules/security/security.module";
import { EscrowSchedulerService } from "./escrow-scheduler.service";

@Module({
  imports: [ScheduleModule.forRoot(), SecurityModule],
  providers: [EscrowSchedulerService],
})
export class TasksModule {}
