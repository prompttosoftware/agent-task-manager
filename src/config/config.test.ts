import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from './config.service';
import { ConfigModule } from './config.module';

describe('ConfigService', () => {
  let service: ConfigService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [ConfigService],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should get a value from config', () => {
    process.env.TEST_VAR = 'test_value';
    expect(service.get('TEST_VAR')).toBe('test_value');
  });

  it('should return undefined if the value is not found', () => {
    expect(service.get('NON_EXISTENT_VAR')).toBeUndefined();
  });
});