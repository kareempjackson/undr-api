import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { EntityManager } from "typeorm";
import { User, UserRole, UserStatus } from "./entities/user.entity";
import { Wallet } from "./entities/wallet.entity";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const entityManager = app.get(EntityManager);

  try {
    // Create a test creator
    const creator = new User();
    creator.email = "creator@example.com";
    creator.name = "Test Creator";
    creator.phoneNumber = "+1234567890";
    creator.role = UserRole.CREATOR;
    creator.status = UserStatus.ACTIVE;
    creator.alias = "test_creator";

    await entityManager.save(creator);

    // Create a wallet for the creator
    const wallet = new Wallet();
    wallet.user = creator;
    wallet.balance = 1000;

    await entityManager.save(wallet);

    console.log("Test creator created successfully with alias:", creator.alias);
    console.log("Creator ID:", creator.id);
  } catch (error) {
    console.error("Error creating test creator:", error);
  } finally {
    await app.close();
  }
}

bootstrap();
