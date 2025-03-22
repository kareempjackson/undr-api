"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("../src/data-source");
const user_entity_1 = require("../src/entities/user.entity");
const Table = require("cli-table3");
async function listUsers() {
    try {
        await data_source_1.AppDataSource.initialize();
        console.log("Database connection established");
        const userRepository = data_source_1.AppDataSource.getRepository(user_entity_1.User);
        const users = await userRepository.find();
        const table = new Table({
            head: [
                "ID",
                "Email",
                "Name",
                "Role",
                "Status",
                "Email Verified",
                "Created At",
            ],
            colWidths: [38, 30, 20, 10, 10, 15, 25],
        });
        users.forEach((user) => {
            table.push([
                user.id,
                user.email,
                user.name || "N/A",
                user.role,
                user.status,
                user.emailVerified ? "Yes" : "No",
                user.createdAt.toISOString(),
            ]);
        });
        console.log(`Total Users: ${users.length}`);
        console.log(table.toString());
    }
    catch (error) {
        console.error("Error:", error);
    }
    finally {
        if (data_source_1.AppDataSource.isInitialized) {
            await data_source_1.AppDataSource.destroy();
            console.log("Database connection closed");
        }
    }
}
listUsers();
//# sourceMappingURL=list-users.js.map