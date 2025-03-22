import { NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { ConfigService } from "@nestjs/config";
declare global {
    namespace Express {
        interface Request {
            clientRegion?: string;
            maskedIp?: string;
            rawIp?: string;
        }
    }
}
export declare class IpMaskingMiddleware implements NestMiddleware {
    private configService;
    private readonly salt;
    private readonly storeFullIpForAdmins;
    constructor(configService: ConfigService);
    use(req: Request, res: Response, next: NextFunction): void;
    private hashIp;
    private extractRegion;
}
