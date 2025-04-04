"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EscrowSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscrowSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const escrow_service_1 = require("../modules/security/escrow.service");
let EscrowSchedulerService = EscrowSchedulerService_1 = class EscrowSchedulerService {
    constructor(escrowService) {
        this.escrowService = escrowService;
        this.logger = new common_1.Logger(EscrowSchedulerService_1.name);
    }
    async handleScheduledReleases() {
        this.logger.log("Processing scheduled escrow releases");
        try {
            const processedCount = await this.escrowService.processScheduledReleases();
            this.logger.log(`Successfully processed ${processedCount} scheduled escrow releases`);
        }
        catch (error) {
            this.logger.error(`Error processing scheduled escrow releases: ${error.message}`, error.stack);
        }
    }
};
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_4_HOURS),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EscrowSchedulerService.prototype, "handleScheduledReleases", null);
EscrowSchedulerService = EscrowSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [escrow_service_1.EscrowService])
], EscrowSchedulerService);
exports.EscrowSchedulerService = EscrowSchedulerService;
//# sourceMappingURL=escrow-scheduler.service.js.map