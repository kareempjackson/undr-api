import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  RiskAssessment,
  RiskLevel,
  RiskFlag,
} from "../../entities/risk-assessment.entity";
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

interface TrustedDevice {
  fingerprint: string;
  name?: string;
  lastUsed?: Date;
  [key: string]: any;
}

@Injectable()
export class RiskAssessmentService {
  constructor(
    @InjectRepository(RiskAssessment)
    private riskAssessmentRepository: Repository<RiskAssessment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>
  ) {}

  /**
   * Assess transaction risk based on various factors
   * @param userId User ID
   * @param paymentId Optional payment ID
   * @param amount Transaction amount
   * @param ipAddress IP address
   * @param deviceInfo Device information
   * @param location Location information
   */
  async assessTransactionRisk(
    userId: string,
    paymentId?: string,
    amount?: number,
    ipAddress?: string,
    deviceInfo?: DeviceInfo,
    location?: string
  ): Promise<RiskAssessment> {
    // Get user history
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ["paymentsSent"],
    });

    // Initialize risk assessment
    const riskAssessment = new RiskAssessment();
    riskAssessment.userId = userId;
    riskAssessment.paymentId = paymentId;
    riskAssessment.ipAddress = ipAddress;
    riskAssessment.deviceInfo = deviceInfo;
    riskAssessment.location = location;

    // Default values
    riskAssessment.riskLevel = RiskLevel.LOW;
    riskAssessment.riskScore = 0;
    riskAssessment.riskFlags = [];

    // Analyze various risk factors
    let riskScore = 0;
    const flags: RiskFlag[] = [];

    // 1. Check for unusual location
    if (user.location && location && user.location !== location) {
      flags.push(RiskFlag.UNUSUAL_LOCATION);
      riskScore += 15;
    }

    // 2. Check for new device
    if (
      deviceInfo?.fingerprint &&
      user.trustedDevices.length > 0 &&
      !user.trustedDevices.some(
        (device) =>
          (device as TrustedDevice).fingerprint === deviceInfo.fingerprint
      )
    ) {
      flags.push(RiskFlag.DEVICE_CHANGE);
      riskScore += 10;
    }

    // 3. Check for large transaction
    if (amount) {
      const averageAmount =
        user.paymentsSent.reduce(
          (sum, payment) => sum + Number(payment.amount),
          0
        ) / (user.paymentsSent.length || 1);

      if (amount > averageAmount * 2 && amount > 100) {
        flags.push(RiskFlag.LARGE_TRANSACTION);
        riskScore += 20;
      }
    }

    // 4. Check for rapid succession payments (multiple transactions in short time)
    const recentPayments = user.paymentsSent.filter(
      (payment) =>
        new Date().getTime() - new Date(payment.createdAt).getTime() < 3600000 // 1 hour
    );

    if (recentPayments.length >= 3) {
      flags.push(RiskFlag.RAPID_SUCCESSION_PAYMENTS);
      riskScore += 15;
    }

    // Calculate risk level based on risk score
    let riskLevel = RiskLevel.LOW;
    if (riskScore >= 50) {
      riskLevel = RiskLevel.CRITICAL;
      riskAssessment.requires3ds = true;
      riskAssessment.requiresMfa = true;
    } else if (riskScore >= 30) {
      riskLevel = RiskLevel.HIGH;
      riskAssessment.requires3ds = true;
    } else if (riskScore >= 15) {
      riskLevel = RiskLevel.MEDIUM;
    }

    // Update risk assessment
    riskAssessment.riskLevel = riskLevel;
    riskAssessment.riskScore = riskScore;
    riskAssessment.riskFlags = flags;

    // If high risk, mark for review
    riskAssessment.reviewRequired =
      riskLevel === RiskLevel.HIGH || riskLevel === RiskLevel.CRITICAL;

    // Block critical risk transactions
    riskAssessment.blocked = riskLevel === RiskLevel.CRITICAL;

    // Save risk assessment
    const savedAssessment = await this.riskAssessmentRepository.save(
      riskAssessment
    );

    // If associated with a payment, update payment's risk score
    if (paymentId) {
      await this.paymentRepository.update(paymentId, {
        riskScore: riskScore,
        isHighRisk:
          riskLevel === RiskLevel.HIGH || riskLevel === RiskLevel.CRITICAL,
      });
    }

    return savedAssessment;
  }

  /**
   * Review a risk assessment
   * @param riskAssessmentId Risk assessment ID
   * @param reviewerId Reviewer user ID
   * @param approved Whether the transaction is approved
   * @param notes Review notes
   */
  async reviewRiskAssessment(
    riskAssessmentId: string,
    reviewerId: string,
    approved: boolean,
    notes?: string
  ): Promise<RiskAssessment> {
    const riskAssessment = await this.riskAssessmentRepository.findOneBy({
      id: riskAssessmentId,
    });

    if (!riskAssessment) {
      throw new Error("Risk assessment not found");
    }

    riskAssessment.reviewedByUserId = reviewerId;
    riskAssessment.reviewNotes = notes;
    riskAssessment.reviewedAt = new Date();
    riskAssessment.blocked = !approved;

    return this.riskAssessmentRepository.save(riskAssessment);
  }

  /**
   * Get high-risk assessments that need review
   */
  async getPendingReviews(): Promise<RiskAssessment[]> {
    return this.riskAssessmentRepository.find({
      where: { reviewRequired: true, reviewedAt: null },
      relations: ["user", "payment"],
      order: { createdAt: "DESC" },
    });
  }
}
