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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const magic_link_service_1 = require("./magic-link.service");
const user_entity_1 = require("../../entities/user.entity");
const wallet_entity_1 = require("../../entities/wallet.entity");
const magic_link_entity_1 = require("../../entities/magic-link.entity");
let AuthService = class AuthService {
    constructor(userRepository, walletRepository, magicLinkRepository, jwtService, magicLinkService) {
        this.userRepository = userRepository;
        this.walletRepository = walletRepository;
        this.magicLinkRepository = magicLinkRepository;
        this.jwtService = jwtService;
        this.magicLinkService = magicLinkService;
    }
    async login(loginDto) {
        const { email } = loginDto;
        let user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            user = this.userRepository.create({
                email,
                status: user_entity_1.UserStatus.PENDING,
            });
            await this.userRepository.save(user);
            const wallet = this.walletRepository.create({
                user,
                balance: 0,
            });
            await this.walletRepository.save(wallet);
        }
        await this.sendMagicLink(email, user.id);
        return { message: "Magic link sent to your email" };
    }
    async verifyMagicLink(token) {
        var _a, _b;
        const userId = await this.magicLinkService.verifyToken(token);
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ["wallet"],
        });
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        if (user.status === user_entity_1.UserStatus.PENDING) {
            user.status = user_entity_1.UserStatus.ACTIVE;
            await this.userRepository.save(user);
        }
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                status: user.status,
                wallet: {
                    id: ((_a = user.wallet) === null || _a === void 0 ? void 0 : _a.id) || "default-wallet",
                    balance: ((_b = user.wallet) === null || _b === void 0 ? void 0 : _b.balance) || 0,
                },
            },
            token: this.jwtService.sign(payload),
        };
    }
    async getProfile(userId) {
        var _a, _b;
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ["wallet"],
        });
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
            wallet: {
                id: ((_a = user.wallet) === null || _a === void 0 ? void 0 : _a.id) || "default-wallet",
                balance: ((_b = user.wallet) === null || _b === void 0 ? void 0 : _b.balance) || 0,
            },
        };
    }
    async sendMagicLink(email, userId) {
        let user;
        if (!userId) {
            user = await this.userRepository.findOne({ where: { email } });
            if (!user) {
                user = this.userRepository.create({
                    email,
                    status: user_entity_1.UserStatus.PENDING,
                });
                await this.userRepository.save(user);
                const wallet = this.walletRepository.create({
                    user,
                    balance: 0,
                });
                await this.walletRepository.save(wallet);
                userId = user.id;
            }
            else {
                userId = user.id;
            }
        }
        await this.magicLinkService.sendMagicLink(email, userId);
    }
    async getUserProfile(userId) {
        var _a, _b;
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ["wallet"],
        });
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            status: user.status,
            wallet: {
                id: ((_a = user.wallet) === null || _a === void 0 ? void 0 : _a.id) || "default-wallet",
                balance: ((_b = user.wallet) === null || _b === void 0 ? void 0 : _b.balance) || 0,
            },
            profileImage: user.profileImage,
            bio: user.bio,
            location: user.location,
            createdAt: user.createdAt,
        };
    }
    async refreshToken(userId) {
        var _a, _b;
        const user = await this.userRepository.findOne({
            where: { id: userId },
            relations: ["wallet"],
        });
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        const payload = {
            sub: user.id,
            email: user.email,
            role: user.role,
        };
        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                status: user.status,
                wallet: {
                    id: ((_a = user.wallet) === null || _a === void 0 ? void 0 : _a.id) || "default-wallet",
                    balance: ((_b = user.wallet) === null || _b === void 0 ? void 0 : _b.balance) || 0,
                },
            },
            token: this.jwtService.sign(payload),
        };
    }
};
AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(wallet_entity_1.Wallet)),
    __param(2, (0, typeorm_1.InjectRepository)(magic_link_entity_1.MagicLink)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        jwt_1.JwtService,
        magic_link_service_1.MagicLinkService])
], AuthService);
exports.AuthService = AuthService;
//# sourceMappingURL=auth.service.js.map