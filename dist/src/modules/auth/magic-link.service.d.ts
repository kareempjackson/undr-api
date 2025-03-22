import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";
import { User } from "../../entities/user.entity";
import { MagicLink } from "../../entities/magic-link.entity";
export declare class MagicLinkService {
    private configService;
    private userRepository;
    private magicLinkRepository;
    private readonly logger;
    private readonly devModeSkipEmail;
    constructor(configService: ConfigService, userRepository: Repository<User>, magicLinkRepository: Repository<MagicLink>);
    createMagicLink(email: string, userId?: string): Promise<string>;
    sendMagicLink(email: string, userId?: string): Promise<void>;
    verifyToken(token: string): Promise<string>;
}
