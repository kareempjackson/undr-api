import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { DisputeService } from "./dispute.service";

@Injectable()
export class DisputeSchedulerService {
  private readonly logger = new Logger(DisputeSchedulerService.name);

  constructor(private readonly disputeService: DisputeService) {}

  /**
   * Process disputes with expired evidence deadlines daily at midnight
   * Changes their status from EVIDENCE_SUBMISSION to UNDER_REVIEW
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredEvidenceDeadlines() {
    this.logger.log(
      "Running scheduled task: Process expired evidence deadlines"
    );

    try {
      await this.disputeService.processExpiredEvidenceDeadlines();
      this.logger.log("Successfully processed expired evidence deadlines");
    } catch (error) {
      this.logger.error(
        `Error processing expired evidence deadlines: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Check for disputes in UNDER_REVIEW status that have been open for too long
   * This could be used to escalate to admin review or apply automated resolution
   * after a certain period (e.g., 14 days)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleStaleDisputes() {
    this.logger.log("Running scheduled task: Check for stale disputes");

    // This would be implemented in a real system to automatically
    // escalate disputes that have been open too long

    // Example implementation would find disputes that have been
    // in UNDER_REVIEW status for more than 14 days and:
    // 1. Send notifications to admins
    // 2. Potentially apply automatic resolution based on business rules
    // 3. Update dispute status to reflect escalation
  }
}
