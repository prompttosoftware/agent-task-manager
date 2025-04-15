import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from './config.service';

describe('ConfigService', () => {
  let service: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ConfigService],
    }).compile();

    service = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEpicKey', () => {
    it('should return the correct epic key for epic number 1', () => {
      expect(service.getEpicKey(1)).toBe('ATM-1');
    });

    it('should return the correct epic key for epic number 2', () => {
      expect(service.getEpicKey(2)).toBe('ATM-2');
    });

    it('should return the correct epic key for epic number 18', () => {
      expect(service.getEpicKey(18)).toBe('ATM-18');
    });

    it('should return undefined for an unknown epic number', () => {
      expect(service.getEpicKey(3)).toBeUndefined();
      expect(service.getEpicKey(0)).toBeUndefined();
      expect(service.getEpicKey(-1)).toBeUndefined();
      expect(service.getEpicKey(19)).toBeUndefined();
    });
  });

  describe('getLastEpicNumber', () => {
    it('should return 18', () => {
      expect(service.getLastEpicNumber()).toBe(18);
    });
  });

  describe('isFinalTestingPassed', () => {
    it('should return true', () => {
      expect(service.isFinalTestingPassed()).toBe(true);
    });
  });

  describe('isCodeReviewApproved', () => {
    it('should return true', () => {
      expect(service.isCodeReviewApproved()).toBe(true);
    });
  });

  describe('isDocumentationFinalized', () => {
    it('should return true', () => {
      expect(service.isDocumentationFinalized()).toBe(true);
    });
  });

    describe('isProjectCleaned', () => {
    it('should return true', () => {
      expect(service.isProjectCleaned()).toBe(true);
    });
  });

  describe('Singleton Pattern', () => {
    it('should ensure only one instance is created', () => {
      const service1 = ConfigService.getInstance();
      const service2 = ConfigService.getInstance();
      expect(service1).toBe(service2);
    });
  });
});
