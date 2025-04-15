import { ConfigService } from '../config/config.service';

export class SignoffService {
  private configService: ConfigService;

  constructor() {
    this.configService = ConfigService.getInstance();
  }

  public async performSignoff(): Promise<boolean> {
    const isFinalTestingPassed = this.configService.isFinalTestingPassed();
    const isCodeReviewApproved = this.configService.isCodeReviewApproved();
    const isDocumentationFinalized = this.configService.isDocumentationFinalized();
    const isProjectCleaned = this.configService.isProjectCleaned();

    return isFinalTestingPassed && isCodeReviewApproved && isDocumentationFinalized && isProjectCleaned;
  }
}
