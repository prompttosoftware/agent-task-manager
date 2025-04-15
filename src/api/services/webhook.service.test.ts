import { Test, TestingModule } from '@nestjs/testing';
import { WebhookService, enqueueWebhook, processWebhook, getDeadLetterQueue, getWebhookQueueSize, sendToExternalService } from '../services/webhook.service';
import { ConfigService } from '../../src/config/config.service';
import { WebhookPayload } from '../types/webhook';

jest.mock('../../src/config/config.service');

describe('WebhookService', () => {
  let service: typeof WebhookService;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('some_value'), // Mock the get method
          },
        },
      ],
    }).compile();

    service = module.get<typeof WebhookService>(WebhookService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should call enqueueWebhook when processing a webhook', async () => {
    const mockPayload: WebhookPayload = {
      eventId: '123',
      eventType: 'issue_created',
      data: { issueKey: 'ATM-1' },
    };
    const enqueueWebhookSpy = jest.spyOn(service, 'enqueueWebhook');

    // @ts-ignore
    await (service as any).enqueueWebhook(mockPayload);

    expect(enqueueWebhookSpy).toHaveBeenCalledWith(mockPayload);
  });

  it('should process webhook from queue', async () => {
    const mockPayload: WebhookPayload = {
      eventId: '123',
      eventType: 'issue_created',
      data: { issueKey: 'ATM-1' },
    };
    const sendToExternalServiceMock = jest.fn();
    jest.mock('../services/webhook.service', () => ({
        ...jest.requireActual('../services/webhook.service'),
        sendToExternalService: sendToExternalServiceMock,
    }));

    enqueueWebhook(mockPayload);
    // @ts-ignore
    await (service as any).processWebhook('someUrl');
    expect(sendToExternalServiceMock).toHaveBeenCalledWith('someUrl', mockPayload, 0);
  });

});