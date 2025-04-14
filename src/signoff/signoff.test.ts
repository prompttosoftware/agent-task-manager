import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from './config.service';
import { SignoffService } from './signoff.service';

describe('SignoffService', () => {
  let service: SignoffService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SignoffService, { provide: ConfigService, useValue: {} }],
    }).compile();

    service = module.get<SignoffService>(SignoffService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});