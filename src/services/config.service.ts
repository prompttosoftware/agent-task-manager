export class ConfigService {
  private static instance: ConfigService;

  private constructor() {}

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  public getEpicKey(epicNumber: number): string | undefined {
    return `ATM-${epicNumber}`;
  }

  public getLastEpicNumber(): number {
    return 18;
  }

  public isFinalTestingPassed(): boolean {
    return true;
  }

  public isCodeReviewApproved(): boolean {
    return true;
  }

  public isDocumentationFinalized(): boolean {
    return true;
  }

  public isProjectCleaned(): boolean {
    return true;
  }
}