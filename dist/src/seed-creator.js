"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
const wallet_entity_1 = require("./entities/wallet.entity");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const entityManager = app.get(typeorm_1.EntityManager);
    try {
        const creator = new user_entity_1.User();
        creator.email = "creator@example.com";
        creator.name = "Test Creator";
        creator.phoneNumber = "+1234567890";
        creator.role = user_entity_1.UserRole.CREATOR;
        creator.status = user_entity_1.UserStatus.ACTIVE;
        creator.alias = "test_creator";
        await entityManager.save(creator);
        const wallet = new wallet_entity_1.Wallet();
        wallet.user = creator;
        wallet.balance = 1000;
        await entityManager.save(wallet);
        console.log("Test creator created successfully with alias:", creator.alias);
        console.log("Creator ID:", creator.id);
    }
    catch (error) {
        console.error("Error creating test creator:", error);
    }
    finally {
        await app.close();
    }
}
bootstrap();
//# sourceMappingURL=seed-creator.js.map