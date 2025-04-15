import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '../../src/config/config.service'; // Corrected import path
import { SignoffService } from './signoff.service';

describe('SignoffService', () => {
    let service: SignoffService;
    let configService: ConfigService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SignoffService,
                {
                    provide: ConfigService,
                    useValue: {
                        // Provide mock implementations for the methods used by SignoffService
                        get: jest.fn((key: string) => {
                            if (key === 'someConfigKey') {
                                return 'mockConfigValue';
                            } 
                            return undefined;
                        }),
                    },
                },
            ],
        }).compile();

        service = module.get<SignoffService>(SignoffService);
        configService = module.get<ConfigService>(ConfigService); // Get the mock ConfigService
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should use config', () => {
        // Example test to check if ConfigService is used correctly
        const configValue = configService.get('someConfigKey');
        expect(configValue).toBe('mockConfigValue');
    });
});