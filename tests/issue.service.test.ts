// src/api/services/issue.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createIssue, updateIssue, getIssueById } from './issue.service';
import Database from 'better-sqlite3';
import { Issue, IssueCreateRequest, IssueUpdateRequest } from '../types/issue.d'; // Import the types

// Mock the better-sqlite3 module
vi.mock('better-sqlite3');
const mockDb = {
    prepare: vi.fn().mockReturnValue({
        run: vi.fn(),
        get: vi.fn(),
    }),
};

describe('IssueService', () => {
    beforeEach(() => {
        // Reset mocks before each test
        vi.clearAllMocks();
    });

    describe('createIssue', () => {
        it('should create an issue successfully', async () => {
            const issueData: IssueCreateRequest = {
                summary: 'Test Summary',
                description: 'Test Description',
                status: 'open',
            };

            const mockRun = mockDb.prepare().run as vi.Mock;
            mockRun.mockReturnValue({ lastInsertRowid: 1 });

            const result = await createIssue(issueData);

            expect(mockDb.prepare).toHaveBeenCalledWith(
                'INSERT INTO issues (summary, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?) returning id;'
            );
            expect(mockRun).toHaveBeenCalledWith(
                issueData.summary,
                issueData.description,
                issueData.status,
                expect.any(String),
                expect.any(String)
            );
            expect(result).toEqual({
                id: 1,
                summary: issueData.summary,
                description: issueData.description,
                status: issueData.status,
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
            });
        });

        it('should handle validation errors', async () => {
            const issueData = {
                summary: '', // Invalid - empty string
                description: 'Test Description',
                status: 'invalid', // Invalid status
            };

            await expect(createIssue(issueData)).rejects.toThrowError(
                'Validation failed: summary must not be empty, status must be one of the following values: open, in progress, resolved, closed'
            );
        });

        it('should handle database errors', async () => {
            const issueData: IssueCreateRequest = {
                summary: 'Test Summary',
                description: 'Test Description',
                status: 'open',
            };

            const mockRun = mockDb.prepare().run as vi.Mock;
            mockRun.mockImplementation(() => {
                throw new Error('Database error');
            });

            await expect(createIssue(issueData)).rejects.toThrowError('Failed to create issue');
        });
    });

    describe('updateIssue', () => {
        it('should update an issue successfully', async () => {
            const issueId = 1;
            const issueData: IssueUpdateRequest = {
                summary: 'Updated Summary',
                description: 'Updated Description',
                status: 'in progress',
            };

            const mockRun = mockDb.prepare().run as vi.Mock;
            mockRun.mockReturnValue({ changes: 1 }); // Simulate successful update

            const mockGet = mockDb.prepare().get as vi.Mock;
            mockGet.mockReturnValue({
                id: issueId,
                summary: issueData.summary,
                description: issueData.description,
                status: issueData.status,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });


            const result = await updateIssue(issueId, issueData);

            expect(mockDb.prepare).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE issues SET summary = ?, description = ?, status = ?, updated_at = ? WHERE id = ?')
            );
            expect(mockRun).toHaveBeenCalledWith(
                issueData.summary,
                issueData.description,
                issueData.status,
                expect.any(String),
                issueId
            );
            expect(mockGet).toHaveBeenCalledWith(issueId);
            expect(result).toEqual({
                id: issueId,
                summary: issueData.summary,
                description: issueData.description,
                status: issueData.status,
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
            });
        });

        it('should handle partial updates', async () => {
            const issueId = 1;
            const issueData: IssueUpdateRequest = {
                summary: 'Updated Summary',
            };

            const mockRun = mockDb.prepare().run as vi.Mock;
            mockRun.mockReturnValue({ changes: 1 }); // Simulate successful update

            const mockGet = mockDb.prepare().get as vi.Mock;
            mockGet.mockReturnValue({
                id: issueId,
                summary: issueData.summary,
                description: 'Original Description',
                status: 'open',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            const result = await updateIssue(issueId, issueData);

            expect(mockDb.prepare).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE issues SET summary = ?, updated_at = ? WHERE id = ?')
            );
            expect(mockRun).toHaveBeenCalledWith(
                issueData.summary,
                expect.any(String),
                issueId
            );
            expect(mockGet).toHaveBeenCalledWith(issueId);

            expect(result).toEqual({
                id: issueId,
                summary: issueData.summary,
                description: 'Original Description',
                status: 'open',
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
            });
        });

        it('should return existing issue if no fields to update', async () => {
            const issueId = 1;
            const issueData: IssueUpdateRequest = {};

            const mockRun = mockDb.prepare().run as vi.Mock;
            mockRun.mockReturnValue({ changes: 0 });

            const mockGet = mockDb.prepare().get as vi.Mock;
            mockGet.mockReturnValue({
                id: issueId,
                summary: 'Original Summary',
                description: 'Original Description',
                status: 'open',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            const result = await updateIssue(issueId, issueData);

            expect(mockDb.prepare).not.toHaveBeenCalled();
            expect(mockGet).toHaveBeenCalledWith(issueId);
            expect(result).toEqual({
                id: issueId,
                summary: 'Original Summary',
                description: 'Original Description',
                status: 'open',
                createdAt: expect.any(String),
                updatedAt: expect.any(String),
            });
        });

        it('should handle validation errors', async () => {
            const issueId = 1;
            const issueData = {
                status: 'invalid', // Invalid status
            };

            await expect(updateIssue(issueId, issueData)).rejects.toThrowError(
                'Validation failed: status must be one of the following values: open, in progress, resolved, closed'
            );
        });

        it('should handle database errors during update', async () => {
            const issueId = 1;
            const issueData: IssueUpdateRequest = {
                summary: 'Updated Summary',
            };

            const mockRun = mockDb.prepare().run as vi.Mock;
            mockRun.mockImplementation(() => {
                throw new Error('Database error');
            });

            await expect(updateIssue(issueId, issueData)).rejects.toThrowError('Failed to update issue');
        });

        it('should handle issue not found during update', async () => {
            const issueId = 1;
            const issueData: IssueUpdateRequest = {
                summary: 'Updated Summary',
            };

            const mockRun = mockDb.prepare().run as vi.Mock;
            mockRun.mockReturnValue({ changes: 0 }); // Simulate no rows updated

            const mockGet = mockDb.prepare().get as vi.Mock;
            mockGet.mockReturnValue(undefined);

            await expect(updateIssue(issueId, issueData)).rejects.toThrowError(`Issue with ID ${issueId} not found`);
        });

        it('should handle issue not found after update', async () => {
            const issueId = 1;
            const issueData: IssueUpdateRequest = {
                summary: 'Updated Summary',
            };

            const mockRun = mockDb.prepare().run as vi.Mock;
            mockRun.mockReturnValue({ changes: 1 }); // Simulate one row updated

            const mockGet = mockDb.prepare().get as vi.Mock;
            mockGet.mockReturnValue(undefined);

            await expect(updateIssue(issueId, issueData)).rejects.toThrowError(`Issue with ID ${issueId} not found after update`);
        });
    });

    describe('getIssueById', () => {
        it('should get an issue by ID successfully', async () => {
            const issueId = 1;
            const expectedIssue: Issue = {
                id: issueId,
                summary: 'Test Summary',
                description: 'Test Description',
                status: 'open',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            const mockGet = mockDb.prepare().get as vi.Mock;
            mockGet.mockReturnValue(expectedIssue);

            const result = await getIssueById(issueId);

            expect(mockDb.prepare).toHaveBeenCalledWith('SELECT id, summary, description, status, created_at, updated_at FROM issues WHERE id = ?');
            expect(mockGet).toHaveBeenCalledWith(issueId);
            expect(result).toEqual(expectedIssue);
        });

        it('should return undefined if issue is not found', async () => {
            const issueId = 999;

            const mockGet = mockDb.prepare().get as vi.Mock;
            mockGet.mockReturnValue(undefined);

            const result = await getIssueById(issueId);

            expect(mockDb.prepare).toHaveBeenCalledWith('SELECT id, summary, description, status, created_at, updated_at FROM issues WHERE id = ?');
            expect(mockGet).toHaveBeenCalledWith(issueId);
            expect(result).toBeUndefined();
        });

        it('should handle database errors', async () => {
            const issueId = 1;

            const mockGet = mockDb.prepare().get as vi.Mock;
            mockGet.mockImplementation(() => {
                throw new Error('Database error');
            });

            await expect(getIssueById(issueId)).rejects.toThrowError('Failed to get issue by ID');
        });
    });
});