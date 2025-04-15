import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { WebhookController } from './webhook.controller';
import { WebhookService } from '../api/services/webhook.service';
import { ConfigService } from '../../config/config.service';
import { AppModule } from '../../src/app.module';
import { RegisterWebhookRequest, Webhook } from '../../types/webhook';
import { StatusCodes } from 'http-status-codes';
import { HttpModule, HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { Logger } from '../../utils/logger';

describe('WebhookController', () => {
  let app: INestApplication;
  let controller: WebhookController;
  let webhookService: WebhookService;
  let configService: ConfigService;
  let httpService: HttpService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, HttpModule],
      controllers: [WebhookController],
      providers: [WebhookService, ConfigService, Logger],
    }).compile();

    app = moduleFixture.createNestApplication();
    controller = moduleFixture.get<WebhookController>(WebhookController);
    webhookService = moduleFixture.get<WebhookService>(WebhookService);
    configService = moduleFixture.get<ConfigService>(ConfigService);
    httpService = moduleFixture.get<HttpService>(HttpService);

    await app.init();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('registerWebhook', () => {
    it('should register a new webhook and return 201', async () => {
      const registerWebhookRequest: RegisterWebhookRequest = {
        url: 'http://example.com/webhook',
        event: 'issue.created',
      };

      const mockWebhook: Webhook = {
        id: 'some-uuid',
        url: registerWebhookRequest.url,
        event: registerWebhookRequest.event,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.spyOn(webhookService, 'createWebhook').mockResolvedValue(mockWebhook);

      const response = await request(app.getHttpServer())
        .post('/webhooks')
        .send(registerWebhookRequest)
        .expect(HttpStatus.CREATED);

      expect(response.body).toEqual(mockWebhook);
    });

    it('should return 400 if the request body is invalid', async () => {
      await request(app.getHttpServer())
        .post('/webhooks')
        .send({ url: 'not-a-url', event: 123 })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('listWebhooks', () => {
    it('should return a list of webhooks and return 200', async () => {
      const mockWebhooks: Webhook[] = [
        {
          id: '1',
          url: 'http://example.com/webhook1',
          event: 'issue.created',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          url: 'http://example.com/webhook2',
          event: 'issue.updated',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.spyOn(webhookService, 'getAllWebhooks').mockResolvedValue(mockWebhooks);

      const response = await request(app.getHttpServer())
        .get('/webhooks')
        .expect(HttpStatus.OK);

      expect(response.body).toEqual(mockWebhooks);
    });
  });

  describe('deleteWebhook', () => {
    it('should delete a webhook and return 204', async () => {
      const webhookId = 'some-uuid';
      jest.spyOn(webhookService, 'deleteWebhook').mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete(`/webhooks/${webhookId}`)
        .expect(HttpStatus.NO_CONTENT);
    });

    it('should return 500 if an error occurs during deletion', async () => {
      const webhookId = 'some-uuid';
      jest.spyOn(webhookService, 'deleteWebhook').mockRejectedValue(new Error('Test Error'));

      await request(app.getHttpServer())
        .delete(`/webhooks/${webhookId}`)
        .expect(HttpStatus.INTERNAL_SERVER_ERROR);
    });
  });

   describe('handleWebhookEvent', () => {
        it('should process a webhook event and return 200', async () => {
            const webhookPayload = {
                event: 'issue.created',
                data: { issue: { key: 'ATM-1' } },
            };

            jest.spyOn(webhookService, 'processWebhookEvent').mockResolvedValue(undefined);

            const response = await request(app.getHttpServer())
                .post('/webhooks/events')
                .send(webhookPayload)
                .expect(HttpStatus.OK);

            expect(webhookService.processWebhookEvent).toHaveBeenCalledWith(webhookPayload);
        });

        it('should return 400 if the event is invalid', async () => {
            const invalidWebhookPayload = { event: 'invalid.event', data: {} };

            await request(app.getHttpServer())
                .post('/webhooks/events')
                .send(invalidWebhookPayload)
                .expect(HttpStatus.BAD_REQUEST);
        });

        it('should return 500 if processing fails', async () => {
            const webhookPayload = {
                event: 'issue.created',
                data: { issue: { key: 'ATM-1' } },
            };
            jest.spyOn(webhookService, 'processWebhookEvent').mockRejectedValue(new Error('Processing Error'));

            await request(app.getHttpServer())
                .post('/webhooks/events')
                .send(webhookPayload)
                .expect(HttpStatus.INTERNAL_SERVER_ERROR);
        });
    });
});