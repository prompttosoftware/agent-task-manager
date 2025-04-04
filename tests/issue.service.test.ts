// src/services/issue.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IssueService } from './issue.service';
import Database from 'better-sqlite3';
import { Issue, IssuePriority, IssueStatus, User, Comment } from '../types/issue';

// Mock the better-sqlite3 module
vi.mock('better-sqlite3');

describe('IssueService', () => {
    let issueService: IssueService;
    let mockDb: any; // Use 'any' to bypass type checking for the mock

    beforeEach(() => {
        // Initialize a mock database
        mockDb = {
            exec: vi.fn(),
            prepare: vi.fn().mockReturnValue({
                run: vi.fn(),
                get: vi.fn(),
                all: vi.fn(),
            }),
        };

        // Instantiate the IssueService with the mock database
        issueService = new IssueService(mockDb);
    });

    it('should initialize the database tables on construction', () => {
        expect(mockDb.exec).toHaveBeenCalledTimes(3); // Assuming 3 table creation queries
        expect(mockDb.exec).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS issues'));
        expect(mockDb.exec).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS users'));
        expect(mockDb.exec).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS comments'));
    });


    describe('createIssue', () => {
        it('should create an issue successfully', async () => {
            const issue: Issue = {
                id: '1',
                title: 'Test Issue',
                description: 'This is a test issue',
                reporter: { id: 'reporter1', name: 'Reporter', email: 'reporter@example.com' },
                assignee: { id: 'assignee1', name: 'Assignee', email: 'assignee@example.com' },
                priority: IssuePriority.High,
                status: IssueStatus.Open,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                comments: [],
            };

            // Mock the prepare method to return a mock statement
            const mockStmt = {
                run: vi.fn(),
            };
            mockDb.prepare.mockReturnValue(mockStmt);

            // Mock the getIssueById method to return the created issue
            const getIssueByIdMock = vi.spyOn(issueService, 'getIssueById').mockResolvedValue(issue);

            const result = await issueService.createIssue(issue);

            expect(mockDb.exec).toHaveBeenCalledWith('BEGIN');
            expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO issues'));
            expect(mockStmt.run).toHaveBeenCalledWith(
                issue.id,
                issue.title,
                issue.description,
                issue.reporter.id,
                issue.assignee?.id,
                issue.priority,
                issue.status,
                issue.createdAt,
                issue.updatedAt,
                undefined,
                undefined,
            );
            expect(mockDb.exec).toHaveBeenCalledWith('COMMIT');
            expect(getIssueByIdMock).toHaveBeenCalledWith(issue.id); // Verify getIssueById was called
            expect(result).toEqual(issue);
        });

        it('should handle errors during issue creation', async () => {
            const issue: Issue = {
                id: '1',
                title: 'Test Issue',
                description: 'This is a test issue',
                reporter: { id: 'reporter1', name: 'Reporter', email: 'reporter@example.com' },
                assignee: { id: 'assignee1', name: 'Assignee', email: 'assignee@example.com' },
                priority: IssuePriority.High,
                status: IssueStatus.Open,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                comments: [],
            };
            const errorMessage = 'Database error';

            // Mock the prepare method to throw an error
            mockDb.prepare.mockReturnValue({
                run: vi.fn().mockImplementation(() => {
                    throw new Error(errorMessage);
                }),
            });

            await expect(issueService.createIssue(issue)).rejects.toThrowError(`Failed to create issue: ${errorMessage}`);
            expect(mockDb.exec).toHaveBeenCalledWith('ROLLBACK');
        });
    });

    describe('getAllIssues', () => {
        it('should get all issues successfully', async () => {
            const issues: Issue[] = [
                {
                    id: '1',
                    title: 'Test Issue 1',
                    description: 'Description 1',
                    reporter: { id: 'reporter1', name: 'Reporter 1', email: 'reporter1@example.com' },
                    assignee: { id: 'assignee1', name: 'Assignee 1', email: 'assignee1@example.com' },
                    priority: IssuePriority.High,
                    status: IssueStatus.Open,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    comments: [],
                },
                {
                    id: '2',
                    title: 'Test Issue 2',
                    description: 'Description 2',
                    reporter: { id: 'reporter2', name: 'Reporter 2', email: 'reporter2@example.com' },
                    assignee: { id: 'assignee2', name: 'Assignee 2', email: 'assignee2@example.com' },
                    priority: IssuePriority.Medium,
                    status: IssueStatus.InProgress,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    comments: [],
                },
            ];

            // Mock the prepare method to return a mock statement
            const mockStmt = {
                all: vi.fn().mockReturnValue(issues.map(issue => ({...issue, labels: undefined, dueDate: undefined}))), // Simulate database results
            };
            mockDb.prepare.mockReturnValue(mockStmt);
            const mapIssueFromDbMock = vi.spyOn(issueService, 'mapIssueFromDb').mockImplementation(async (issue) => issue as Issue);

            const result = await issueService.getAllIssues();

            expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM issues'));
            expect(mockStmt.all).toHaveBeenCalled();
            expect(mapIssueFromDbMock).toHaveBeenCalledTimes(2);
            expect(result).toEqual(issues);
        });

        it('should handle errors when getting all issues', async () => {
            const errorMessage = 'Database error';

            // Mock the prepare method to throw an error
            mockDb.prepare.mockReturnValue({
                all: vi.fn().mockImplementation(() => {
                    throw new Error(errorMessage);
                }),
            });

            await expect(issueService.getAllIssues()).rejects.toThrowError(`Failed to get all issues: ${errorMessage}`);
        });
    });

    describe('getIssueById', () => {
        it('should get an issue by ID successfully', async () => {
            const issue: Issue = {
                id: '1',
                title: 'Test Issue',
                description: 'This is a test issue',
                reporter: { id: 'reporter1', name: 'Reporter', email: 'reporter@example.com' },
                assignee: { id: 'assignee1', name: 'Assignee', email: 'assignee@example.com' },
                priority: IssuePriority.High,
                status: IssueStatus.Open,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                comments: [],
            };

            // Mock the prepare method to return a mock statement
            const mockStmt = {
                get: vi.fn().mockReturnValue({...issue, labels: undefined, dueDate: undefined}), // Simulate database result
            };
            mockDb.prepare.mockReturnValue(mockStmt);

            const mapIssueFromDbMock = vi.spyOn(issueService, 'mapIssueFromDb').mockResolvedValue(issue);

            const result = await issueService.getIssueById('1');

            expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM issues WHERE id = ?'));
            expect(mockStmt.get).toHaveBeenCalledWith('1');
            expect(mapIssueFromDbMock).toHaveBeenCalledWith(expect.objectContaining({ id: '1' }));
            expect(result).toEqual(issue);
        });

        it('should return undefined if issue is not found', async () => {
            // Mock the prepare method to return a mock statement
            const mockStmt = {
                get: vi.fn().mockReturnValue(undefined), // Simulate database result
            };
            mockDb.prepare.mockReturnValue(mockStmt);

            const result = await issueService.getIssueById('nonexistent');

            expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM issues WHERE id = ?'));
            expect(mockStmt.get).toHaveBeenCalledWith('nonexistent');
            expect(result).toBeUndefined();
        });

        it('should handle errors when getting issue by ID', async () => {
            const errorMessage = 'Database error';

            // Mock the prepare method to throw an error
            mockDb.prepare.mockReturnValue({
                get: vi.fn().mockImplementation(() => {
                    throw new Error(errorMessage);
                }),
            });

            await expect(issueService.getIssueById('1')).rejects.toThrowError(`Failed to get issue by ID: ${errorMessage}`);
        });
    });

    describe('updateIssue', () => {
        it('should update an issue successfully', async () => {
            const updatedIssue: Issue = {
                id: '1',
                title: 'Updated Test Issue',
                description: 'This is an updated test issue',
                reporter: { id: 'reporter1', name: 'Reporter', email: 'reporter@example.com' },
                assignee: { id: 'assignee1', name: 'Assignee', email: 'assignee@example.com' },
                priority: IssuePriority.Medium,
                status: IssueStatus.InProgress,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                comments: [],
            };

            // Mock the prepare method to return a mock statement
            const mockStmt = {
                run: vi.fn(),
            };
            mockDb.prepare.mockReturnValue(mockStmt);

            // Mock the getIssueById method to return the updated issue
            const getIssueByIdMock = vi.spyOn(issueService, 'getIssueById').mockResolvedValue(updatedIssue);

            const result = await issueService.updateIssue(updatedIssue);

            expect(mockDb.exec).toHaveBeenCalledWith('BEGIN');
            expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE issues'));
            expect(mockStmt.run).toHaveBeenCalledWith(
                updatedIssue.title,
                updatedIssue.description,
                updatedIssue.reporter.id,
                updatedIssue.assignee?.id,
                updatedIssue.priority,
                updatedIssue.status,
                expect.any(String), // updatedAt - check for any string
                undefined,
                undefined,
                updatedIssue.id,
            );
            expect(mockDb.exec).toHaveBeenCalledWith('COMMIT');
            expect(getIssueByIdMock).toHaveBeenCalledWith(updatedIssue.id); // Verify getIssueById was called
            expect(result).toEqual(updatedIssue);
        });

        it('should handle errors when updating an issue', async () => {
            const issue: Issue = {
                id: '1',
                title: 'Test Issue',
                description: 'This is a test issue',
                reporter: { id: 'reporter1', name: 'Reporter', email: 'reporter@example.com' },
                assignee: { id: 'assignee1', name: 'Assignee', email: 'assignee@example.com' },
                priority: IssuePriority.High,
                status: IssueStatus.Open,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                comments: [],
            };
            const errorMessage = 'Database error';

            // Mock the prepare method to throw an error
            mockDb.prepare.mockReturnValue({
                run: vi.fn().mockImplementation(() => {
                    throw new Error(errorMessage);
                }),
            });

            await expect(issueService.updateIssue(issue)).rejects.toThrowError(`Failed to update issue: ${errorMessage}`);
            expect(mockDb.exec).toHaveBeenCalledWith('ROLLBACK');
        });
    });

    describe('deleteIssue', () => {
        it('should delete an issue successfully', async () => {
            // Mock the prepare method to return a mock statement
            const mockStmt = {
                run: vi.fn(),
            };
            mockDb.prepare.mockReturnValue(mockStmt);

            await issueService.deleteIssue('1');

            expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM issues WHERE id = ?'));
            expect(mockStmt.run).toHaveBeenCalledWith('1');
        });

        it('should handle errors when deleting an issue', async () => {
            const errorMessage = 'Database error';

            // Mock the prepare method to throw an error
            mockDb.prepare.mockReturnValue({
                run: vi.fn().mockImplementation(() => {
                    throw new Error(errorMessage);
                }),
            });

            await expect(issueService.deleteIssue('1')).rejects.toThrowError(`Failed to delete issue: ${errorMessage}`);
        });
    });

    describe('mapIssueFromDb', () => {
        it('should correctly map issue data from the database', async () => {
            const dbIssue = {
                id: '1',
                title: 'Test Issue',
                description: 'This is a test issue',
                reporterId: 'reporter1',
                assigneeId: 'assignee1',
                priority: 'High',
                status: 'Open',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                labels: JSON.stringify(['label1', 'label2']),
                dueDate: new Date().toISOString(),
            };
            const expectedIssue: Issue = {
                id: '1',
                title: 'Test Issue',
                description: 'This is a test issue',
                reporter: { id: 'reporter1', name: 'Reporter', email: 'reporter@example.com' },
                assignee: { id: 'assignee1', name: 'Assignee', email: 'assignee@example.com' },
                priority: IssuePriority.High,
                status: IssueStatus.Open,
                createdAt: dbIssue.createdAt,
                updatedAt: dbIssue.updatedAt,
                labels: ['label1', 'label2'],
                dueDate: dbIssue.dueDate,
                comments: [],
            };
            // Mock getUserById to return a user
            vi.spyOn(issueService, 'getUserById').mockImplementation(async (id: string) => {
                if (id === 'reporter1') {
                    return { id: 'reporter1', name: 'Reporter', email: 'reporter@example.com' };
                }
                if (id === 'assignee1') {
                    return { id: 'assignee1', name: 'Assignee', email: 'assignee@example.com' };
                }
                return undefined;
            });
            // Mock getCommentsByIssueId to return an empty array
            vi.spyOn(issueService, 'getCommentsByIssueId').mockResolvedValue([]);

            const result = await issueService.mapIssueFromDb(dbIssue);

            expect(result).toEqual(expect.objectContaining({
                id: '1',
                title: 'Test Issue',
                description: 'This is a test issue',
                reporter: { id: 'reporter1', name: 'Reporter', email: 'reporter@example.com' },
                assignee: { id: 'assignee1', name: 'Assignee', email: 'assignee@example.com' },
                priority: IssuePriority.High,
                status: IssueStatus.Open,
                createdAt: dbIssue.createdAt,
                updatedAt: dbIssue.updatedAt,
                labels: ['label1', 'label2'],
                dueDate: dbIssue.dueDate,
                comments: [],
            }));
        });

        it('should handle null or undefined values correctly', async () => {
            const dbIssue = {
                id: '1',
                title: 'Test Issue',
                description: 'This is a test issue',
                reporterId: 'reporter1',
                assigneeId: null,
                priority: 'High',
                status: 'Open',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                labels: null,
                dueDate: null,
            };

            // Mock getUserById to return a user
            vi.spyOn(issueService, 'getUserById').mockResolvedValue({ id: 'reporter1', name: 'Reporter', email: 'reporter@example.com' });
            vi.spyOn(issueService, 'getCommentsByIssueId').mockResolvedValue([]);

            const result = await issueService.mapIssueFromDb(dbIssue);

            expect(result).toEqual(expect.objectContaining({
                id: '1',
                title: 'Test Issue',
                description: 'This is a test issue',
                reporter: { id: 'reporter1', name: 'Reporter', email: 'reporter@example.com' },
                assignee: undefined,
                priority: IssuePriority.High,
                status: IssueStatus.Open,
                createdAt: dbIssue.createdAt,
                updatedAt: dbIssue.updatedAt,
                labels: undefined,
                dueDate: undefined,
                comments: [],
            }));
        });
    });

    describe('insertOrUpdateUser', () => {
        it('should insert or update a user successfully', () => {
            const user: User = { id: 'user1', name: 'Test User', email: 'test@example.com' };
            const mockStmt = { run: vi.fn() };
            mockDb.prepare.mockReturnValue(mockStmt);

            issueService.insertOrUpdateUser(user);

            expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT OR REPLACE INTO users'));
            expect(mockStmt.run).toHaveBeenCalledWith(user.id, user.name, user.email);
        });

        it('should handle errors during user insertion/update', () => {
            const user: User = { id: 'user1', name: 'Test User', email: 'test@example.com' };
            const errorMessage = 'Database error';
            mockDb.prepare.mockReturnValue({
                run: vi.fn().mockImplementation(() => {
                    throw new Error(errorMessage);
                }),
            });

            expect(() => issueService.insertOrUpdateUser(user)).toThrowError(`Failed to insert/update user: ${errorMessage}`);
        });
    });

    describe('getUserById', () => {
        it('should get a user by ID successfully', async () => {
            const user: User = { id: 'user1', name: 'Test User', email: 'test@example.com' };
            const mockStmt = { get: vi.fn().mockReturnValue({id: 'user1', name: 'Test User', email: 'test@example.com'}) };
            mockDb.prepare.mockReturnValue(mockStmt);

            const result = await issueService.getUserById('user1');

            expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM users WHERE id = ?'));
            expect(mockStmt.get).toHaveBeenCalledWith('user1');
            expect(result).toEqual(user);
        });

        it('should return undefined if user is not found', async () => {
            const mockStmt = { get: vi.fn().mockReturnValue(undefined) };
            mockDb.prepare.mockReturnValue(mockStmt);

            const result = await issueService.getUserById('nonexistent');

            expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM users WHERE id = ?'));
            expect(mockStmt.get).toHaveBeenCalledWith('nonexistent');
            expect(result).toBeUndefined();
        });

        it('should handle errors when getting user by ID', async () => {
            const errorMessage = 'Database error';
            mockDb.prepare.mockReturnValue({
                get: vi.fn().mockImplementation(() => {
                    throw new Error(errorMessage);
                }),
            });

            await expect(issueService.getUserById('user1')).rejects.toThrowError(`Failed to get user by ID: ${errorMessage}`);
        });
    });

    describe('insertComment', () => {
        it('should insert a comment successfully', () => {
            const comment: Comment = {
                id: 'comment1',
                author: { id: 'user1', name: 'Test User', email: 'test@example.com' },
                content: 'Test comment',
                createdAt: new Date().toISOString(),
            };

            const mockStmt = { run: vi.fn() };
            mockDb.prepare.mockReturnValue(mockStmt);

            issueService.insertComment('issue1', comment);

            expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO comments'));
            expect(mockStmt.run).toHaveBeenCalledWith(comment.id, 'issue1', comment.author.id, comment.content, comment.createdAt);
        });

        it('should handle errors during comment insertion', () => {
            const comment: Comment = {
                id: 'comment1',
                author: { id: 'user1', name: 'Test User', email: 'test@example.com' },
                content: 'Test comment',
                createdAt: new Date().toISOString(),
            };
            const errorMessage = 'Database error';
            mockDb.prepare.mockReturnValue({
                run: vi.fn().mockImplementation(() => {
                    throw new Error(errorMessage);
                }),
            });

            expect(() => issueService.insertComment('issue1', comment)).toThrowError(`Failed to insert comment: ${errorMessage}`);
        });
    });

    describe('getCommentsByIssueId', () => {
        it('should get comments by issue ID successfully', async () => {
            const comments: Comment[] = [
                {
                    id: 'comment1',
                    author: { id: 'user1', name: 'Test User', email: 'test@example.com' },
                    content: 'Test comment 1',
                    createdAt: new Date().toISOString(),
                },
                {
                    id: 'comment2',
                    author: { id: 'user2', name: 'Another User', email: 'another@example.com' },
                    content: 'Test comment 2',
                    createdAt: new Date().toISOString(),
                },
            ];

            const mockStmt = {
                all: vi.fn().mockReturnValue(comments.map(comment => ({...comment, authorName: comment.author.name, authorEmail: comment.author.email}))),
            };
            mockDb.prepare.mockReturnValue(mockStmt);

            const result = await issueService.getCommentsByIssueId('issue1');

            expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT c.*, u.name AS authorName, u.email AS authorEmail'));
            expect(mockStmt.all).toHaveBeenCalledWith('issue1');
            expect(result).toEqual(comments);
        });

        it('should handle errors when getting comments by issue ID', async () => {
            const errorMessage = 'Database error';
            mockDb.prepare.mockReturnValue({
                all: vi.fn().mockImplementation(() => {
                    throw new Error(errorMessage);
                }),
            });

            await expect(issueService.getCommentsByIssueId('issue1')).rejects.toThrowError(`Failed to get comments by issue ID: ${errorMessage}`);
        });
    });

    describe('deleteCommentsForIssue', () => {
        it('should delete comments for an issue successfully', () => {
            const mockStmt = { run: vi.fn() };
            mockDb.prepare.mockReturnValue(mockStmt);

            issueService.deleteCommentsForIssue('issue1');

            expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM comments WHERE issueId = ?'));
            expect(mockStmt.run).toHaveBeenCalledWith('issue1');
        });

        it('should handle errors when deleting comments for an issue', () => {
            const errorMessage = 'Database error';
            mockDb.prepare.mockReturnValue({
                run: vi.fn().mockImplementation(() => {
                    throw new Error(errorMessage);
                }),
            });

            expect(() => issueService.deleteCommentsForIssue('issue1')).toThrowError(`Failed to delete comments for issue: ${errorMessage}`);
        });
    });
});