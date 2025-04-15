export class ConfigService {
  private static instance: ConfigService;
  private config: { [key: string]: any } = {};

  private constructor() {
    // Initialize config here or load from a file
    this.config = {
      webhookUrl: 'http://example.com/webhook'
    };
  }

  public static getInstance(): ConfigService {
    if (!ConfigService.instance) {
      ConfigService.instance = new ConfigService();
    }
    return ConfigService.instance;
  }

  public get(key: string): any {
    return this.config[key];
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