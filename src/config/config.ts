// src/config/config.ts

/**
 * Configuration module to load environment variables.
 *
 * Provides default values if environment variables are not set.
 */
class Config {
  private constructor() {} // Make it a static class

  static readonly DATABASE_URL: string = process.env.DATABASE_URL || "mongodb://localhost:27017/defaultdb";
  static readonly PORT: number = parseInt(process.env.PORT || "3000", 10);
  static readonly NODE_ENV: string = process.env.NODE_ENV || "development";

  /**
   *  Dynamically checks if we're in a test environment based on NODE_ENV
   *  Avoids side-effects on import and allows environment overriding for tests
   */
  static get isTestEnvironment(): boolean {
      return this.NODE_ENV === "test";
  }

  /**
   * Dynamically checks if we're in a development environment.
   */
  static get isDevelopmentEnvironment(): boolean {
      return this.NODE_ENV === "development";
  }

   /**
   * Dynamically checks if we're in a production environment.
   */
  static get isProductionEnvironment(): boolean {
      return this.NODE_ENV === "production";
  }


  /**
   * Optional method to add more config options.  This is illustrative.
   * @param key The environment variable key.
   * @param defaultValue A fallback default value.
   * @returns The value of the config option, or the default value if not found.
   */
  static getOptionalConfig(key: string, defaultValue: string): string {
    return process.env[key] || defaultValue;
  }

  /**
   * Optional method to add more config options, handling number coercion
   * @param key The environment variable key.
   * @param defaultValue A fallback default value.
   * @returns The value of the config option, or the default value if not found.
   */
  static getOptionalNumberConfig(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (value) {
      const parsedValue = parseInt(value, 10);
      if (!isNaN(parsedValue)) {
        return parsedValue;
      }
    }
    return defaultValue;
  }
}

export default Config;
