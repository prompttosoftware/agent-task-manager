// src/services/config.service.ts
import Config from '../config/config';

export interface TestResult {
    testName: string;
    status: 'pass' | 'fail';
    message?: string;
}

export interface CodeReviewStatus {
    status: 'approved' | 'pending' | 'changes_requested';
    reviewer?: string;
    comments?: string;
}

export interface DocumentationStatus {
    status: 'complete' | 'incomplete' | 'pending';
    missingSections?: string[];
}

export interface CleanupStatus {
    status: 'finalized' | 'pending' | 'in_progress';
    notes?: string;
}

class ConfigService {
    private static instance: ConfigService;

    private constructor() {}

    public static getInstance(): ConfigService {
        if (!ConfigService.instance) {
            ConfigService.instance = new ConfigService();
        }
        return ConfigService.instance;
    }

    /**
     * Gets the last epic number from environment variables or defaults.
     * @returns The last epic number.
     */
    public getLastEpicNumber(): number {
        return Config.getOptionalNumberConfig('LAST_EPIC_NUMBER', 100);
    }

    /**
     * Gets the first epic number from environment variables or defaults.
     * @returns The first epic number.
     */
    public getFirstEpicNumber(): number {
        return Config.getOptionalNumberConfig('FIRST_EPIC_NUMBER', 1);
    }

    /**
     * Example of another config value.  This demonstrates how to use Config to fetch string based configs
     * @returns {string} Example configuration value
     */
    public getExampleStringConfig(): string {
        return Config.getOptionalConfig('EXAMPLE_STRING_CONFIG', 'default_value');
    }

    public getTestResults(): TestResult[] {
        // Mock data for test results
        return [
            { testName: 'Authentication Test', status: 'pass' },
            { testName: 'User Profile Test', status: 'pass' },
            { testName: 'Order Processing Test', status: 'fail', message: 'Failed due to invalid address' },
        ];
    }

    public getCodeReviewStatus(): CodeReviewStatus {
        // Mock data for code review status
        return {
            status: 'approved',
            reviewer: 'John Doe',
            comments: 'Code looks good, ready to merge.'
        };
    }

    public getDocumentationStatus(): DocumentationStatus {
        // Mock data for documentation status
        return {
            status: 'incomplete',
            missingSections: ['API Endpoints', 'Deployment Guide']
        };
    }

    public getCleanupStatus(): CleanupStatus {
        // Mock data for cleanup status
        return {
            status: 'pending',
            notes: 'Need to remove temporary files and database backups.'
        };
    }
}

export default ConfigService;
