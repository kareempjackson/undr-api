import { Repository } from "typeorm";
import { User } from "../../../entities/user.entity";
export declare class AliasService {
    private userRepository;
    private readonly logger;
    constructor(userRepository: Repository<User>);
    findUserByAlias(alias: string): Promise<User>;
    generateUniqueAlias(userId: string, preferredAlias?: string): Promise<string>;
    updateAlias(userId: string, newAlias: string): Promise<User>;
}
