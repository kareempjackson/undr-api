import { Repository } from "typeorm";
import { RiskAssessment } from "../../entities/risk-assessment.entity";
import { User } from "../../entities/user.entity";
import { Payment } from "../../entities/payment.entity";
interface DeviceInfo {
    fingerprint?: string;
    userAgent?: string;
    platform?: string;
    screenResolution?: string;
    timezone?: string;
    language?: string;
    hardware?: any;
}
export declare class RiskAssessmentService {
    private riskAssessmentRepository;
    private userRepository;
    private paymentRepository;
    constructor(riskAssessmentRepository: Repository<RiskAssessment>, userRepository: Repository<User>, paymentRepository: Repository<Payment>);
    assessTransactionRisk(userId: string, paymentId?: string, amount?: number, ipAddress?: string, deviceInfo?: DeviceInfo, location?: string): Promise<RiskAssessment>;
    reviewRiskAssessment(riskAssessmentId: string, reviewerId: string, approved: boolean, notes?: string): Promise<RiskAssessment>;
    getPendingReviews(): Promise<RiskAssessment[]>;
}
export {};
