import { Test, TestingModule } from '@nestjs/testing';
import { WebhookService } from '../services/webhook.service';
import { ConfigService } from '../../config/config.service';
import { HttpService } from '@nestjs/axios';

// Define interfaces for mocking
interface MockConfigService {
  get: jest.Mock;
}

interface MockHttpService {
  post: jest.Mock;
}

describe('WebhookService', () => {
  let service: WebhookService;
  let configService: MockConfigService;
  let httpService: MockHttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
    configService = module.get(ConfigService) as any;
    httpService = module.get(HttpService) as any;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(configService).toBeDefined();
    expect(httpService).toBeDefined();
  });

  // Add tests for webhook service methods here
});