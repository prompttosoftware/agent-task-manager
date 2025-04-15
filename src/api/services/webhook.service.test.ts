import { Test, TestingModule } from '@nestjs/testing';
import { WebhookService } from '../services/webhook.service';
import { ConfigService } from '../../config/config.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs'; // Import 'of' for creating observable mocks

// Define interfaces for mocking WITH proper types
interface MockConfigService {
  get: jest.Mock<any, [string]>; // 'any' is a placeholder, refine if possible
}

interface MockHttpService {
  post: jest.Mock<any, any[]>; // 'any' is a placeholder, refine if possible
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
            get: jest.fn((key: string) => { // Type the argument 'key'
              if (key === 'someConfigValue') {
                return 'testValue'; // Example return value
              }
              return undefined; // Or a default value if not found
            }),
          },
        },
        {
          provide: HttpService,
          useValue: {
            post: jest.fn(() => of({ data: { success: true } })), // Mock the 'post' method and return an observable
          },
        },
      ],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
    configService = module.get(ConfigService);
    httpService = module.get(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(configService).toBeDefined();
    expect(httpService).toBeDefined();
  });

  // Add tests for webhook service methods here
});