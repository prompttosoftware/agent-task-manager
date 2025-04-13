import { ProjectSignOff } from './signoff';
import ConfigService from '../services/config.service';
import { TestResult, CodeReviewStatus, DocumentationStatus, CleanupStatus } from '../services/config.service';
import { DatabaseService } from '../services/database.service';
import { EpicService } from '../services/epic.service';
import { IssueService } from '../services/issue.service';

// Mock the ConfigService to provide predictable results
jest.mock('../services/config.service');
jest.mock('../services/epic.service');
jest.mock('../services/issue.service');

// Mock the DatabaseService to prevent actual database calls
jest.mock('../services/database.service');

describe('ProjectSignOff', () => {
    let projectSignOff: ProjectSignOff;
    let mockConfigService: jest.Mocked<ConfigService>;
    let mockDatabaseService: jest.Mocked<DatabaseService>;
    let mockEpicService: jest.Mocked<EpicService>;
    let mockIssueService: jest.Mocked<IssueService>;

    beforeEach(() => {
        projectSignOff = new ProjectSignOff();
        mockConfigService = (ConfigService.getInstance as jest.Mock<ConfigService, []>)() as jest.Mocked<ConfigService>;
        mockDatabaseService = (projectSignOff as any).databaseService as jest.Mocked<DatabaseService>;
        mockEpicService = (projectSignOff as any).epicService as jest.Mocked<EpicService>;
        mockIssueService = (projectSignOff as any).issueService as jest.Mocked<IssueService>;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Verification Methods', () => {
        it('should verify final testing status based on ConfigService', () => {
            mockConfigService.isFinalTestingPassed.mockReturnValue(true);
            const result = projectSignOff.verifyFinalTesting();
            expect(result).toBe(true);
            mockConfigService.isFinalTestingPassed.mockReturnValue(false);
            const resultFail = projectSignOff.verifyFinalTesting();
            expect(resultFail).toBe(false);
            expect(mockConfigService.isFinalTestingPassed).toHaveBeenCalled();
        });

        it('should verify code review status based on ConfigService', () => {
            mockConfigService.isCodeReviewApproved.mockReturnValue(true);
            const result = projectSignOff.verifyCodeReview();
            expect(result).toBe(true);
            mockConfigService.isCodeReviewApproved.mockReturnValue(false);
            const resultPending = projectSignOff.verifyCodeReview();
            expect(resultPending).toBe(false);
            expect(mockConfigService.isCodeReviewApproved).toHaveBeenCalled();
        });

        it('should verify documentation status based on ConfigService', () => {
            mockConfigService.isDocumentationFinalized.mockReturnValue(true);
            const result = projectSignOff.verifyDocumentation();
            expect(result).toBe(true);
            mockConfigService.isDocumentationFinalized.mockReturnValue(false);
            const resultIncomplete = projectSignOff.verifyDocumentation();
            expect(resultIncomplete).toBe(false);
            expect(mockConfigService.isDocumentationFinalized).toHaveBeenCalled();
        });

        it('should verify project cleanup status based on ConfigService', () => {
            mockConfigService.isProjectCleaned.mockReturnValue(true);
            const result = projectSignOff.verifyProjectCleanup();
            expect(result).toBe(true);
            mockConfigService.isProjectCleaned.mockReturnValue(false);
            const resultPending = projectSignOff.verifyProjectCleanup();
            expect(resultPending).toBe(false);
            expect(mockConfigService.isProjectCleaned).toHaveBeenCalled();
        });
    });

    describe('runChecks', () => {
        it('should return true if all checks pass', async () => {
            mockConfigService.isFinalTestingPassed.mockReturnValue(true);
            mockConfigService.isCodeReviewApproved.mockReturnValue(true);
            mockConfigService.isDocumentationFinalized.mockReturnValue(true);
            mockConfigService.isProjectCleaned.mockReturnValue(true);
            mockConfigService.getLastEpicNumber.mockReturnValue(18);
            mockConfigService.getEpicKey.mockReturnValue('ATM-18');
            mockEpicService.getIssuesForEpic.mockResolvedValue(['ISSUE-1', 'ISSUE-2']);
            mockIssueService.getIssue.mockResolvedValue({status: 'Done'});

            const result = await projectSignOff.runChecks();

            expect(result).toBe(true);
            expect(mockConfigService.isFinalTestingPassed).toHaveBeenCalled();
            expect(mockConfigService.isCodeReviewApproved).toHaveBeenCalled();
            expect(mockConfigService.isDocumentationFinalized).toHaveBeenCalled();
            expect(mockConfigService.isProjectCleaned).toHaveBeenCalled();
        });

        it('should return false if any check fails', async () => {
            mockConfigService.isFinalTestingPassed.mockReturnValue(false);
            mockConfigService.isCodeReviewApproved.mockReturnValue(true);
            mockConfigService.isDocumentationFinalized.mockReturnValue(true);
            mockConfigService.isProjectCleaned.mockReturnValue(true);
             mockConfigService.getLastEpicNumber.mockReturnValue(18);
             mockConfigService.getEpicKey.mockReturnValue('ATM-18');
            mockEpicService.getIssuesForEpic.mockResolvedValue(['ISSUE-1', 'ISSUE-2']);
            mockIssueService.getIssue.mockResolvedValue({status: 'Done'});

            const result = await projectSignOff.runChecks();

            expect(result).toBe(false);
             expect(mockConfigService.isFinalTestingPassed).toHaveBeenCalled();
            expect(mockConfigService.isCodeReviewApproved).toHaveBeenCalled();
            expect(mockConfigService.isDocumentationFinalized).toHaveBeenCalled();
            expect(mockConfigService.isProjectCleaned).toHaveBeenCalled();
        });

        it('should handle errors during epic task verification', async () => {
            mockConfigService.getLastEpicNumber.mockReturnValue(18);
            mockConfigService.getEpicKey.mockReturnValue('ATM-18');
            mockEpicService.getIssuesForEpic.mockRejectedValue(new Error('Epic Service Error'));
            mockConfigService.isFinalTestingPassed.mockReturnValue(true);
            mockConfigService.isCodeReviewApproved.mockReturnValue(true);
            mockConfigService.isDocumentationFinalized.mockReturnValue(true);
            mockConfigService.isProjectCleaned.mockReturnValue(true);

            const result = await projectSignOff.runChecks();

            expect(result).toBe(false);
        });
    });
});