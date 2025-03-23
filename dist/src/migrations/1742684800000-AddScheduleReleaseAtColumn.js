"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddScheduleReleaseAtColumn1742684800000 = void 0;
class AddScheduleReleaseAtColumn1742684800000 {
    async up(queryRunner) {
        const hasColumn = await queryRunner.hasColumn("escrows", "scheduleReleaseAt");
        if (!hasColumn) {
            await queryRunner.query(`ALTER TABLE "escrows" ADD "scheduleReleaseAt" TIMESTAMP`);
        }
    }
    async down(queryRunner) {
        const hasColumn = await queryRunner.hasColumn("escrows", "scheduleReleaseAt");
        if (hasColumn) {
            await queryRunner.query(`ALTER TABLE "escrows" DROP COLUMN "scheduleReleaseAt"`);
        }
    }
}
exports.AddScheduleReleaseAtColumn1742684800000 = AddScheduleReleaseAtColumn1742684800000;
//# sourceMappingURL=1742684800000-AddScheduleReleaseAtColumn.js.map