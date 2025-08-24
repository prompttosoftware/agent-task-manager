import express from 'express';
import { app as expressApp } from './app';
import config from './config';
import { AppDataSource } from "./data-source";
import { seedDatabase } from "./db/seed"; // Make sure path is correct

const PORT = config.PORT || 3000;

// Initialize Data Source and Seed Database
AppDataSource.initialize()
  .then(async () => {
    console.log("Data Source has been initialized!");

    console.log("Synchronizing database schema...");
    await AppDataSource.synchronize();
    console.log("Database schema is ready.");

    await seedDatabase(); 
    console.log("Database has been seeded.");

    // Now that the DB is ready, start the server
    expressApp.get('/health', (req, res) => {
      res.status(200).send('OK');
    });

    expressApp.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

  })
  .catch((err) => {
    console.error("Error during application startup:", err);
    process.exit(1); // Exit if DB connection fails
  });
