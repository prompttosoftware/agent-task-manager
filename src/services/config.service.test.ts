// src/services/config.service.test.ts
import Config from '../config/config';
import ConfigService, { TestResult, CodeReviewStatus, DocumentationStatus, CleanupStatus } from '../services/config.service';

describe('ConfigService', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = ConfigService.getInstance();
  });

  it('should retrieve the last epic number from environment variables or default', () => {
    // Arrange
    const expectedLastEpicNumber = 100;
    process.env.LAST_EPIC_NUMBER = expectedLastEpicNumber.toString();

    // Act
    const lastEpicNumber = configService.getLastEpicNumber();

    // Assert
    expect(lastEpicNumber).toBe(expectedLastEpicNumber);
    delete process.env.LAST_EPIC_NUMBER;
  });

  it('should retrieve the default last epic number if environment variable is not set', () => {
    // Arrange
    delete process.env.LAST_EPIC_NUMBER;

    // Act
    const lastEpicNumber = configService.getLastEpicNumber();

    // Assert
    expect(lastEpicNumber).toBe(100);
  });

  it('should retrieve the first epic number from environment variables or default', () => {
    // Arrange
    const expectedFirstEpicNumber = 1;
    process.env.FIRST_EPIC_NUMBER = expectedFirstEpicNumber.toString();

    // Act
    const firstEpicNumber = configService.getFirstEpicNumber();

    // Assert
    expect(firstEpicNumber).toBe(expectedFirstEpicNumber);
    delete process.env.FIRST_EPIC_NUMBER;
  });

  it('should retrieve the default first epic number if environment variable is not set', () => {
    // Arrange
    delete process.env.FIRST_EPIC_NUMBER;

    // Act
    const firstEpicNumber = configService.getFirstEpicNumber();

    // Assert
    expect(firstEpicNumber).toBe(1);
  });

  it('should retrieve example string config from environment variables or default', () => {
    const expectedValue = 'test_value';
    process.env.EXAMPLE_STRING_CONFIG = expectedValue;
    const value = configService.getExampleStringConfig();
    expect(value).toBe(expectedValue);
    delete process.env.EXAMPLE_STRING_CONFIG;
  });

  it('should retrieve the default example string config if environment variable is not set', () => {
    delete process.env.EXAMPLE_STRING_CONFIG;
    const value = configService.getExampleStringConfig();
    expect(value).toBe('default_value');
  });

  describe('Project Sign-off Status', () => {
    it('should retrieve test results', () => {
      const testResults: TestResult[] = configService.getTestResults();
      expect(testResults).toBeInstanceOf(Array);
      expect(testResults.length).toBeGreaterThan(0);
    });

    it('should retrieve code review status', () => {
      const codeReviewStatus: CodeReviewStatus = configService.getCodeReviewStatus();
      expect(codeReviewStatus).toBeDefined();
      expect(codeReviewStatus).toHaveProperty('status');
    });

    it('should retrieve documentation status', () => {
      const documentationStatus: DocumentationStatus = configService.getDocumentationStatus();
      expect(documentationStatus).toBeDefined();
      expect(documentationStatus).toHaveProperty('status');
    });

    it('should retrieve cleanup status', () => {
      const cleanupStatus: CleanupStatus = configService.getCleanupStatus();
      expect(cleanupStatus).toBeDefined();
      expect(cleanupStatus).toHaveProperty('status');
    });
  });
});