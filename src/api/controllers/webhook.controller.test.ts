import { Test, TestingModule } from '@nestjs/testing';
import { WebhookController } from './webhook.controller';
import { WebhookService } from '../api/services/webhook.service';
import { ConfigService } from '../../config/config.service';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { WebhookPayload } from '../../../types/webhook';

describe('WebhookController', () => {
  let controller: WebhookController;
  let webhookService: WebhookService;
  let configService: ConfigService;
  let app: INestApplication;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        WebhookService,
        {
          provide: WebhookService,
          useValue: {
            handleWebhook: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<WebhookController>(WebhookController);
    webhookService = module.get<WebhookService>(WebhookService);
    configService = module.get<ConfigService>(ConfigService);

    app = module.createNestApplication();
    await app.init();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(webhookService).toBeDefined();
  });

  it('should handle webhook', async () => {
    const payload: WebhookPayload = {
      event: 'issue_created',
      data: { issue: { key: 'ATM-123' } },
    };
    jest.spyOn(webhookService, 'handleWebhook').mockResolvedValue(undefined);

    const response = await request(app.getHttpServer())
      .post('/webhooks')
      .send(payload);

    expect(response.status).toBe(201);
    expect(webhookService.handleWebhook).toHaveBeenCalledWith(payload);
  });

  afterEach(async () => {
    await app.close();
  });
});
