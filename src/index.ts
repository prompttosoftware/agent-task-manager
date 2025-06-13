import { AppDataSource } from "./data-source";
import { seedDatabase } from "./db/seed";

AppDataSource.initialize()
    .then(async () => {
        console.log("Data Source has been initialized!");
        await seedDatabase();
    })
    .catch((err) => {
        console.error("Error during Data Source initialization:", err);
    });
