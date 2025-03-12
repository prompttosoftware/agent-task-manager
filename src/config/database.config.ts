// src/config/database.config.ts
import { Sequelize } from 'sequelize-typescript';
import { Issue } from '../models/issue.model';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: ':memory:', // Use in-memory SQLite for testing
  logging: false, // Disable logging during tests
  models: [Issue], // Add your models here
});

export default sequelize;
