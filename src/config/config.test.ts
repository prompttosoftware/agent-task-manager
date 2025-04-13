// src/config/config.test.ts

import Config from './config';

describe('Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules(); // Important - clears any cached config
    process.env = { ...originalEnv }; // Copy original env
  });

  afterEach(() => {
    process.env = originalEnv; // Restore original env
  });

  it('should load default values when environment variables are not provided', () => {
    delete process.env.DATABASE_URL;
    delete process.env.PORT;
    delete process.env.NODE_ENV;

    expect(Config.DATABASE_URL).toBe("mongodb://localhost:27017/defaultdb");
    expect(Config.PORT).toBe(3000);
    expect(Config.NODE_ENV).toBe("development");
    expect(Config.isTestEnvironment).toBe(false);
    expect(Config.isDevelopmentEnvironment).toBe(true);
    expect(Config.isProductionEnvironment).toBe(false);
  });

  it('should load environment variables correctly', () => {
    process.env.DATABASE_URL = "mongodb://localhost:27017/testdb";
    process.env.PORT = "4000";
    process.env.NODE_ENV = "test";

    expect(Config.DATABASE_URL).toBe("mongodb://localhost:27017/testdb");
    expect(Config.PORT).toBe(4000);
    expect(Config.NODE_ENV).toBe("test");
    expect(Config.isTestEnvironment).toBe(true);
    expect(Config.isDevelopmentEnvironment).toBe(false);
    expect(Config.isProductionEnvironment).toBe(false);
  });

  it('should use optional config method to load environment variables or default string value', () => {
    process.env.OPTIONAL_STRING = "optional_value";
    expect(Config.getOptionalConfig("OPTIONAL_STRING", "default_value")).toBe("optional_value");
    expect(Config.getOptionalConfig("MISSING_STRING", "default_value")).toBe("default_value");
    delete process.env.OPTIONAL_STRING;
  });

  it('should use optional config method to load environment variables or default number value', () => {
    process.env.OPTIONAL_NUMBER = "5000";
    expect(Config.getOptionalNumberConfig("OPTIONAL_NUMBER", 1000)).toBe(5000);
    expect(Config.getOptionalNumberConfig("MISSING_NUMBER", 1000)).toBe(1000);
    delete process.env.OPTIONAL_NUMBER;
  });

  it('should return default number value if optional number env var is NaN', () => {
    process.env.OPTIONAL_NUMBER = "not_a_number";
    expect(Config.getOptionalNumberConfig("OPTIONAL_NUMBER", 1000)).toBe(1000);
    delete process.env.OPTIONAL_NUMBER;
  });

  it('should dynamically determine environment correctly', () => {
     process.env.NODE_ENV = "test";
     expect(Config.isTestEnvironment).toBe(true);
     expect(Config.isDevelopmentEnvironment).toBe(false);
     expect(Config.isProductionEnvironment).toBe(false);

     process.env.NODE_ENV = "development";
     expect(Config.isTestEnvironment).toBe(false);
     expect(Config.isDevelopmentEnvironment).toBe(true);
     expect(Config.isProductionEnvironment).toBe(false);

     process.env.NODE_ENV = "production";
     expect(Config.isTestEnvironment).toBe(false);
     expect(Config.isDevelopmentEnvironment).toBe(false);
     expect(Config.isProductionEnvironment).toBe(true);

     delete process.env.NODE_ENV; // Ensure default behavior is still correct
     expect(Config.isTestEnvironment).toBe(false);
     expect(Config.isDevelopmentEnvironment).toBe(true);
     expect(Config.isProductionEnvironment).toBe(false);
  });
});
