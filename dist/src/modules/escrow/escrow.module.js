"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EscrowModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const escrow_entity_1 = require("../../entities/escrow.entity");
const delivery_proof_entity_1 = require("../../entities/delivery-proof.entity");
const transaction_log_entity_1 = require("../../entities/transaction-log.entity");
const user_entity_1 = require("../../entities/user.entity");
const payment_entity_1 = require("../../entities/payment.entity");
const escrow_service_1 = require("./escrow.service");
const escrow_controller_1 = require("./escrow.controller");
let EscrowModule = class EscrowModule {
};
EscrowModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                escrow_entity_1.Escrow,
                delivery_proof_entity_1.DeliveryProof,
                transaction_log_entity_1.TransactionLog,
                user_entity_1.User,
                payment_entity_1.Payment,
            ]),
        ],
        controllers: [escrow_controller_1.EscrowController],
        providers: [escrow_service_1.EscrowService],
        exports: [escrow_service_1.EscrowService],
    })
], EscrowModule);
exports.EscrowModule = EscrowModule;
//# sourceMappingURL=escrow.module.js.map