import { Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";
import { User } from "../../../entities/user.entity";
declare const JwtStrategy_base: new (...args: unknown[] | [opt: import("passport-jwt").StrategyOptions] | [opt: import("passport-jwt").StrategyOptions]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly configService;
    private readonly userRepository;
    constructor(configService: ConfigService, userRepository: Repository<User>);
    validate(payload: any): Promise<{
        id: any;
        email: any;
        role: import("../../../entities/user.entity").UserRole;
    }>;
}
export {};
