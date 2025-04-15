import { Test, TestingModule } from '@nestjs/testing';
import { SignoffService } from './signoff';

describe('SignoffService', () => {
  let service: SignoffService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SignoffService],
    }).compile();

    service = module.get<SignoffService>(SignoffService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Add tests for signoff service methods here
});