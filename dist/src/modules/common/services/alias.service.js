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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AliasService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AliasService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../../../entities/user.entity");
const crypto = require("crypto");
let AliasService = AliasService_1 = class AliasService {
    constructor(userRepository) {
        this.userRepository = userRepository;
        this.logger = new common_1.Logger(AliasService_1.name);
    }
    async findUserByAlias(alias) {
        if (!alias) {
            throw new common_1.NotFoundException("Alias is required");
        }
        const user = await this.userRepository.findOne({
            where: { alias },
            relations: ["wallet"],
        });
        if (!user) {
            throw new common_1.NotFoundException(`User with alias ${alias} not found`);
        }
        return user;
    }
    async generateUniqueAlias(userId, preferredAlias) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${userId} not found`);
        }
        if (user.alias) {
            return user.alias;
        }
        let alias;
        let isUnique = false;
        let attempts = 0;
        const maxAttempts = 10;
        if (preferredAlias) {
            const exists = await this.userRepository.findOne({
                where: { alias: preferredAlias },
            });
            if (!exists) {
                alias = preferredAlias;
                isUnique = true;
            }
            else {
                this.logger.log(`Preferred alias "${preferredAlias}" is already taken`);
            }
        }
        while (!isUnique && attempts < maxAttempts) {
            const randomPart = crypto.randomBytes(4).toString("hex");
            const rolePrefix = user.role.toLowerCase();
            alias = `${rolePrefix}_${randomPart}`;
            const exists = await this.userRepository.findOne({
                where: { alias },
            });
            if (!exists) {
                isUnique = true;
            }
            attempts += 1;
        }
        if (!isUnique) {
            throw new common_1.ConflictException("Failed to generate a unique alias after multiple attempts");
        }
        user.alias = alias;
        await this.userRepository.save(user);
        return alias;
    }
    async updateAlias(userId, newAlias) {
        const user = await this.userRepository.findOne({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${userId} not found`);
        }
        const exists = await this.userRepository.findOne({
            where: { alias: newAlias },
        });
        if (exists && exists.id !== userId) {
            throw new common_1.ConflictException(`Alias "${newAlias}" is already taken`);
        }
        user.alias = newAlias;
        return this.userRepository.save(user);
    }
};
AliasService = AliasService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AliasService);
exports.AliasService = AliasService;
//# sourceMappingURL=alias.service.js.map