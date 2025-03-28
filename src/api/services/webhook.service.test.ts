// src/api/services/webhook.service.test.ts
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { WebhookService } from './webhook.service';
import { MockWebhookRequest, MockQueue } from '../../test/mocks';
import { TaskManager } from '../../data/task_manager';

// Mock the dependencies
jest.mock('../../data/task_manager');

describe('WebhookService', () => {
  let webhookService: WebhookService;
  let mockTaskManager: any;
  let mockQueue: any;

  beforeEach(() => {
    mockTaskManager = new (TaskManager as jest.MockedClass<typeof TaskManager>)();
    mockQueue = {
      add: jest.fn(),
      process: jest.fn(),
    };
    webhookService = new WebhookService(mockTaskManager, mockQueue);
  });

  it('should be defined', () => {
    expect(webhookService).toBeDefined();
  });

  it('should add a webhook request to the queue', async () => {
    const mockRequest = new MockWebhookRequest('payload');
    await webhookService.processWebhook(mockRequest);
    expect(mockQueue.add).toHaveBeenCalledWith(expect.objectContaining({ payload: 'payload' }));
  });

  it('should process the queue', async () => {
    const mockRequest = new MockWebhookRequest('payload');
    mockQueue.process.mockResolvedValueOnce(undefined);
    await webhookService.processWebhook(mockRequest);
    expect(mockQueue.process).toHaveBeenCalled();
  });

  it('should handle errors during queue processing', async () => {
    const mockRequest = new MockWebhookRequest('payload');
    const errorMessage = 'Queue processing error';
    mockQueue.process.mockRejectedValueOnce(new Error(errorMessage));
    try {
      await webhookService.processWebhook(mockRequest);
    } catch (error: any) {
      expect(error.message).toBe(errorMessage);
    }
    expect(mockQueue.process).toHaveBeenCalled();
  });

  it('should call TaskManager methods with correct parameters when handling task updates', async () => {
    const mockRequest = new MockWebhookRequest(JSON.stringify({ event: 'task.updated', data: { id: '123', status: 'in progress' } }));

    // Mock the queue to resolve immediately
    mockQueue.add.mockImplementation(async (job: any) => {
      await job.data.handler();
    });

    await webhookService.processWebhook(mockRequest);

    expect(mockTaskManager.updateTaskStatus).toHaveBeenCalledWith('123', 'in progress');
  });

  it('should call TaskManager methods with correct parameters when handling task creation', async () => {
    const mockRequest = new MockWebhookRequest(JSON.stringify({ event: 'task.created', data: { id: '456', description: 'New task' } }));

    // Mock the queue to resolve immediately
    mockQueue.add.mockImplementation(async (job: any) => {
      await job.data.handler();
    });

    await webhookService.processWebhook(mockRequest);

    expect(mockTaskManager.createTask).toHaveBeenCalledWith({ id: '456', description: 'New task' });
  });

  it('should call TaskManager methods with correct parameters when handling task deletion', async () => {
    const mockRequest = new MockWebhookRequest(JSON.stringify({ event: 'task.deleted', data: { id: '789' } }));

    // Mock the queue to resolve immediately
    mockQueue.add.mockImplementation(async (job: any) => {
      await job.data.handler();
    });

    await webhookService.processWebhook(mockRequest);

    expect(mockTaskManager.deleteTask).toHaveBeenCalledWith('789');
  });
});
