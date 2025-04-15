import { Test, TestingModule } from '@nestjs/testing';
import { EpicController } from './epic.controller';
import { EpicService } from '../services/epic.service';
import { Express } from 'express';
import { setupApp } from '../../../src/app';
import request from 'supertest';
import { Epic } from '../../types/epic';

describe('EpicController', () => {
  let controller: EpicController;
  let app: Express;
  let epicService: EpicService;

  beforeAll(async () => {
    app = await setupApp();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EpicController],
      providers: [EpicService],
    }).compile();

    controller = module.get<EpicController>(EpicController);
    epicService = module.get<EpicService>(EpicService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should create an epic', async () => {
    const createEpicDto = { name: 'Test Epic', description: 'Test Description' };
    const createdEpic: Epic = { id: '1', ...createEpicDto };
    jest.spyOn(epicService, 'createEpic').mockResolvedValue(createdEpic);

    const response = await request(app)
      .post('/api/epics')
      .send(createEpicDto);

    expect(response.status).toBe(201);
    expect(response.body).toEqual(createdEpic);
    expect(epicService.createEpic).toHaveBeenCalledWith(createEpicDto);
  });
});
