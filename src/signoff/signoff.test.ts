import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { SignoffService } from './../signoff/signoff.service';
import { SignoffController } from './../api/controllers/signoff.controller';
import { expect } from '@jest/globals';
import { NestExpressApplication } from '@nestjs/platform-express';

describe('SignoffController', () => {
  let controller: SignoffController;
  let service: SignoffService;
  let app: INestApplication;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SignoffController],
      providers: [SignoffService],
    }).compile();

    controller = module.get<SignoffController>(SignoffController);
    service = module.get<SignoffService>(SignoffService);

     app = module.get<INestApplication>(INestApplication);
     await app.init();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // Add tests for signoff functionality here
});