import { Test, TestingModule } from "@nestjs/testing";
import { WithdrawalsService } from "./withdrawals.service";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Withdrawal } from "../../entities/withdrawal.entity";
import { User } from "../../entities/user.entity";
import { Wallet } from "../../entities/wallet.entity";
import { Repository } from "typeorm";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { PaymentMethod, WithdrawalStatus } from "../../entities/common.enums";

describe("WithdrawalsService", () => {
  let service: WithdrawalsService;
  let withdrawalRepositoryMock: Partial<Repository<Withdrawal>>;
  let userRepositoryMock: Partial<Repository<User>>;
  let walletRepositoryMock: Partial<Repository<Wallet>>;

  beforeEach(async () => {
    withdrawalRepositoryMock = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    userRepositoryMock = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    walletRepositoryMock = {
      save: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WithdrawalsService,
        {
          provide: getRepositoryToken(Withdrawal),
          useValue: withdrawalRepositoryMock,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepositoryMock,
        },
        {
          provide: getRepositoryToken(Wallet),
          useValue: walletRepositoryMock,
        },
      ],
    }).compile();

    service = module.get<WithdrawalsService>(WithdrawalsService);
  });

  describe("findAllByUser", () => {
    it("should return an array of withdrawals for a user", async () => {
      const mockWithdrawals = [{ id: "1" }, { id: "2" }];
      withdrawalRepositoryMock.find = jest
        .fn()
        .mockResolvedValue(mockWithdrawals);

      const result = await service.findAllByUser("user-123");

      expect(withdrawalRepositoryMock.find).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        relations: ["user"],
      });
      expect(result).toEqual(mockWithdrawals);
    });
  });

  describe("createWithdrawal", () => {
    it("should throw NotFoundException if user not found", async () => {
      userRepositoryMock.findOne = jest.fn().mockResolvedValue(null);

      await expect(
        service.createWithdrawal(
          "user-123",
          100,
          '{"method":"bank","accountNumber":"12345"}'
        )
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw BadRequestException if user has no wallet", async () => {
      userRepositoryMock.findOne = jest.fn().mockResolvedValue({
        id: "user-123",
        wallet: null,
      });

      await expect(
        service.createWithdrawal(
          "user-123",
          100,
          '{"method":"bank","accountNumber":"12345"}'
        )
      ).rejects.toThrow(BadRequestException);
    });

    it("should throw BadRequestException if insufficient balance", async () => {
      userRepositoryMock.findOne = jest.fn().mockResolvedValue({
        id: "user-123",
        wallet: {
          balance: 50,
        },
      });

      await expect(
        service.createWithdrawal(
          "user-123",
          100,
          '{"method":"bank","accountNumber":"12345"}'
        )
      ).rejects.toThrow(BadRequestException);
      expect(withdrawalRepositoryMock.save).not.toHaveBeenCalled();
    });

    it("should throw BadRequestException if invalid destination format", async () => {
      userRepositoryMock.findOne = jest.fn().mockResolvedValue({
        id: "user-123",
        wallet: {
          balance: 100,
        },
      });

      await expect(
        service.createWithdrawal("user-123", 50, "invalid-json")
      ).rejects.toThrow(BadRequestException);
      expect(withdrawalRepositoryMock.save).not.toHaveBeenCalled();
    });

    it("should throw BadRequestException if missing destination info", async () => {
      userRepositoryMock.findOne = jest.fn().mockResolvedValue({
        id: "user-123",
        wallet: {
          balance: 100,
        },
      });

      await expect(
        service.createWithdrawal("user-123", 50, '{"method":"bank"}')
      ).rejects.toThrow(BadRequestException);
      expect(withdrawalRepositoryMock.save).not.toHaveBeenCalled();
    });

    it("should create a withdrawal and update wallet balance", async () => {
      const userId = "user-123";
      const amount = 50;
      const destination = JSON.stringify({
        method: "bank",
        accountNumber: "12345",
        currency: "USD",
      });

      const user = {
        id: userId,
        wallet: {
          id: "wallet-123",
          balance: 100,
        },
      };

      const mockWithdrawal = {
        id: "withdrawal-123",
        userId,
        amount,
        method: PaymentMethod.WALLET,
        status: WithdrawalStatus.PENDING,
        payoutDetails: {
          methodType: "bank",
          accountNumber: "12345",
          currency: "USD",
        },
      };

      userRepositoryMock.findOne = jest.fn().mockResolvedValue(user);
      withdrawalRepositoryMock.create = jest
        .fn()
        .mockReturnValue(mockWithdrawal);
      withdrawalRepositoryMock.save = jest
        .fn()
        .mockResolvedValue(mockWithdrawal);

      const result = await service.createWithdrawal(
        userId,
        amount,
        destination
      );

      expect(withdrawalRepositoryMock.create).toHaveBeenCalledWith({
        userId,
        amount,
        method: PaymentMethod.WALLET,
        status: WithdrawalStatus.PENDING,
        payoutDetails: {
          methodType: "bank",
          accountNumber: "12345",
          currency: "USD",
        },
      });

      expect(withdrawalRepositoryMock.save).toHaveBeenCalledWith(
        mockWithdrawal
      );
      expect(user.wallet.balance).toBe(50); // 100 - 50
      expect(walletRepositoryMock.save).toHaveBeenCalledWith(user.wallet);
      expect(result).toEqual(mockWithdrawal);
    });
  });
});
