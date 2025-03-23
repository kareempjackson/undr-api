import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { EscrowService } from "../modules/security/escrow.service";

@Injectable()
export class EscrowSchedulerService {
  private readonly logger = new Logger(EscrowSchedulerService.name);

  constructor(private readonly escrowService: EscrowService) {}

  /**
   * Process scheduled escrow releases every 4 hours
   * This will check for escrows that have reached their scheduleReleaseAt date
   * and automatically release the funds to the seller
   */
  @Cron(CronExpression.EVERY_4_HOURS)
  async handleScheduledReleases() {
    this.logger.log("Processing scheduled escrow releases");

    try {
      const processedCount =
        await this.escrowService.processScheduledReleases();
      this.logger.log(
        `Successfully processed ${processedCount} scheduled escrow releases`
      );
    } catch (error) {
      this.logger.error(
        `Error processing scheduled escrow releases: ${error.message}`,
        error.stack
      );
    }
  }
}
