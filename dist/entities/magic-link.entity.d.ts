import { User } from "./user.entity";
export declare class MagicLink {
    id: string;
    token: string;
    expiresAt: Date;
    used: boolean;
    createdAt: Date;
    userId: string;
    user: User;
}
