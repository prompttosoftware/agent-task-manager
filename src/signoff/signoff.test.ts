import { Test, TestingModule } from '@nestjs/testing';
import { SignoffService } from './signoff';
import { ConfigService } from '../config/config.service';

describe('SignoffService', () => {
  let service: SignoffService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SignoffService,
        {
          provide: ConfigService,
          useValue: {
            isFinalTestingPassed: jest.fn().mockReturnValue(true),
            isCodeReviewApproved: jest.fn().mockReturnValue(true),
            isDocumentationFinalized: jest.fn().mockReturnValue(true),
            isProjectCleaned: jest.fn().mockReturnValue(true),
            get: jest.fn().mockReturnValue('http://example.com/webhook'),
          },
        },
      ],
    }).compile();

    service = module.get<SignoffService>(SignoffService);
    // @ts-ignore
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return true if all checks pass', async () => {
    const result = await service.performSignoff();
    expect(result).toBe(true);
  });
});