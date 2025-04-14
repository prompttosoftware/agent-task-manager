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
    switch (epicNumber) {
      case 1:
        return 'ATM-1';
      case 2:
        return 'ATM-2';
      case 18:
        return 'ATM-18';
      default:
        return undefined;
    }
  }

  public getLastEpicNumber(): number | undefined {
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
