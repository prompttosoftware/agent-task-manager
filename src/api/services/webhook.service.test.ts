import { Test, TestingModule } from '@nestjs/testing';
import { WebhookService, enqueueWebhook, processWebhook, getDeadLetterQueue, getWebhookQueueSize } from './webhook.service';
import { WebhookPayload } from '../../types/webhook';
import { ConfigService } from '../../config/config.service'; // Corrected path
import logger from '../../utils/logger'; // Corrected path
import { HttpModule, HttpService } from '@nestjs/axios';
import { of } from 'rxjs';

jest.mock('../../utils/logger'); // Corrected path

describe('WebhookService', () => {
    let service: WebhookService;
    let configService: jest.Mocked<ConfigService>;
    let loggerSpy: any;
    let httpService: HttpService; // Add HttpService

    beforeEach(async () => {
        configService = {
            get: jest.fn().mockImplementation((key: string) => {
                if (key === 'webhook.url') {
                    return 'http://example.com/webhook';
                }
                if (key === 'project.isProjectCleaned') {
                  return false;
                }
                return undefined;
            }),
            isProjectCleaned: jest.fn().mockReturnValue(false)
        } as jest.Mocked<ConfigService>;

        const module: TestingModule = await Test.createTestingModule({
            imports: [HttpModule], // Add HttpModule
            providers: [
                WebhookService,
                { provide: ConfigService, useValue: configService },
            ],
        }).compile();

        service = module.get<WebhookService>(WebhookService);
        httpService = module.get(HttpService); // Get HttpService
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should enqueue a webhook', () => {
        const payload: WebhookPayload = {
            eventId: '123',
            eventType: 'issue_created',
            data: { issue: { key: 'ATM-1', fields: { summary: 'Test Issue' } } },
        };

        const consoleLogSpy = jest.spyOn(console, 'log');
        enqueueWebhook(payload);

        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Enqueuing webhook with payload:'));
        consoleLogSpy.mockRestore();
    });

    it('should process a webhook', async () => {
        const consoleLogSpy = jest.spyOn(console, 'log');
        await processWebhook('http://example.com/webhook');
        expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Processing webhook for URL:'));
        consoleLogSpy.mockRestore();
    });

    it('should get dead letter queue', () => {
        const deadLetterQueue = getDeadLetterQueue();
        expect(deadLetterQueue).toEqual([]);
    });

    it('should get webhook queue size', () => {
        const queueSize = getWebhookQueueSize();
        expect(queueSize).toBe(0);
    });
});