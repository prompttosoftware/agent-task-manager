// src/services/issue.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IssueService } from './issue.service';
import { Issue, IssuePriority, IssueStatus, User, Comment } from '../types/issue';
import Database from 'better-sqlite3';

// Mock the better-sqlite3 module to avoid actual database interaction
vi.mock('better-sqlite3', () => {
    const mockDb = {
        exec: vi.fn(),
        prepare: vi.fn(() => ({
            run: vi.fn(),
            get: vi.fn(),
            all: vi.fn(),
        })),
        close: vi.fn(),
    };
    return {
        default: vi.fn(() => mockDb),
    };
});

describe('IssueService', () => {
    let issueService: IssueService;
    let mockDb: any;

    beforeEach(() => {
        // Re-initialize the mock database and service before each test
        mockDb = {
            exec: vi.fn(),
            prepare: vi.fn(() => ({
                run: vi.fn(),
                get: vi.fn(),
                all: vi.fn(),
            })),
            close: vi.fn(),
        };
        (Database as any).mockImplementation(() => mockDb); // Correctly apply the mock
        issueService = new IssueService(mockDb);
    });

    const sampleUser: User = {
        id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
    };

    const sampleComment: Comment = {
      id: 'comment123',
      author: sampleUser,
      content: 'Test comment',
      createdAt: new Date().toISOString(),
    }

    const sampleIssue: Issue = {
        id: 'issue123',
        title: 'Test Issue',
        description: 'This is a test issue',
        reporter: sampleUser,
        assignee: sampleUser,
        priority: IssuePriority.High,
        status: IssueStatus.Open,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        labels: ['bug', 'urgent'],
        dueDate: new Date().toISOString(),
        comments: [sampleComment],
    };

    // Helper function to prepare a successful getIssueById mock
    const mockGetIssueByIdSuccess = (issue: Issue) => {
        const preparedStmt = {
            get: vi.fn().mockReturnValue({
                ...issue,
                reporterId: issue.reporter.id,
                assigneeId: issue.assignee?.id,
                labels: issue.labels ? JSON.stringify(issue.labels) : null,
            }),
        };
        mockDb.prepare.mockReturnValue(preparedStmt);
        mockDb.prepare.mockImplementation(query => {
            if (query.includes('SELECT * FROM issues WHERE id = ?')) {
                return preparedStmt;
            } else if (query.includes('SELECT * FROM users WHERE id = ?')) {
                return { get: vi.fn().mockReturnValue(issue.assignee) }; // Mock user lookup
            } else if (query.includes('SELECT c.*, u.name AS authorName, u.email AS authorEmail')) {
                return { all: vi.fn().mockReturnValue(issue.comments.map(comment => ({
                    ...comment,
                    authorId: comment.author.id,
                    authorName: comment.author.name,
                    authorEmail: comment.author.email,
                }))) }; // Mock comment lookup
            }
            return { get: vi.fn().mockReturnValue(undefined) }; // Default for other queries
        });

    };

    // Helper function to prepare a successful getAllIssues mock
    const mockGetAllIssuesSuccess = (issues: Issue[]) => {
      const preparedStmt = {
          all: vi.fn().mockReturnValue(issues.map(issue => ({
              ...issue,
              reporterId: issue.reporter.id,
              assigneeId: issue.assignee?.id,
              labels: issue.labels ? JSON.stringify(issue.labels) : null,
          }))),
      };
      mockDb.prepare.mockReturnValue(preparedStmt);
      mockDb.prepare.mockImplementation(query => {
          if (query.includes('SELECT * FROM issues')) {
              return preparedStmt;
          } else if (query.includes('SELECT * FROM users WHERE id = ?')) {
              return { get: vi.fn().mockReturnValue(sampleUser) }; // Mock user lookup
          } else if (query.includes('SELECT c.*, u.name AS authorName, u.email AS authorEmail')) {
              return { all: vi.fn().mockReturnValue(sampleIssue.comments.map(comment => ({
                  ...comment,
                  authorId: comment.author.id,
                  authorName: comment.author.name,
                  authorEmail: comment.author.email,
              }))) }; // Mock comment lookup
          }
          return { get: vi.fn().mockReturnValue(undefined) }; // Default for other queries
      });
  };



    describe('createIssue', () => {
        it('should create a new issue successfully', async () => {
            mockGetIssueByIdSuccess(sampleIssue); // Mock for getIssueById to return the created issue
            mockDb.exec.mockImplementation((sql: string) => {
                if (sql.startsWith('BEGIN')) return;
                if (sql.startsWith('COMMIT')) return;
                if (sql.startsWith('ROLLBACK')) return;
            });

            const createdIssue = await issueService.createIssue(sampleIssue);

            expect(createdIssue).toEqual(sampleIssue);
            expect(mockDb.prepare).toHaveBeenCalledTimes(4); // INSERT issue, insert/replace user (reporter & assignee), and insert comment(s)
            expect(mockDb.exec).toHaveBeenCalledTimes(2); // BEGIN and COMMIT
        });

        it('should handle errors during issue creation', async () => {
            const errorMessage = 'Simulated database error';
            mockDb.exec.mockImplementation(() => {
                throw new Error(errorMessage);
            });

            await expect(issueService.createIssue(sampleIssue)).rejects.toThrowError(`Failed to create issue: ${errorMessage}`);
            expect(mockDb.exec).toHaveBeenCalledWith('ROLLBACK'); // Ensure rollback on error
        });

        it('should handle null or undefined assignee', async () => {
            const issueWithoutAssignee = { ...sampleIssue, assignee: undefined };
            mockGetIssueByIdSuccess(issueWithoutAssignee); // Mock for getIssueById to return the created issue
            mockDb.exec.mockImplementation((sql: string) => {
              if (sql.startsWith('BEGIN')) return;
              if (sql.startsWith('COMMIT')) return;
              if (sql.startsWith('ROLLBACK')) return;
            });

            const createdIssue = await issueService.createIssue(issueWithoutAssignee);

            expect(createdIssue).toEqual(issueWithoutAssignee);
            expect(mockDb.prepare).toHaveBeenCalledTimes(3); // INSERT issue, insert/replace user (reporter), and insert comment(s)
        });

        it('should handle empty labels', async () => {
            const issueWithEmptyLabels = { ...sampleIssue, labels: [] };
            mockGetIssueByIdSuccess(issueWithEmptyLabels);
            mockDb.exec.mockImplementation((sql: string) => {
              if (sql.startsWith('BEGIN')) return;
              if (sql.startsWith('COMMIT')) return;
              if (sql.startsWith('ROLLBACK')) return;
            });


            const createdIssue = await issueService.createIssue(issueWithEmptyLabels);

            expect(createdIssue).toEqual(issueWithEmptyLabels);
            expect(mockDb.prepare).toHaveBeenCalledTimes(4);
        });
    });

    describe('getAllIssues', () => {
      it('should retrieve all issues successfully', async () => {
          const issues: Issue[] = [sampleIssue, { ...sampleIssue, id: 'issue456', title: 'Another Issue' }];
          mockGetAllIssuesSuccess(issues);

          const retrievedIssues = await issueService.getAllIssues();
          expect(retrievedIssues).toEqual(issues);
          expect(mockDb.prepare).toHaveBeenCalledTimes(1); // SELECT all issues
      });

      it('should handle errors during getAllIssues', async () => {
          const errorMessage = 'Simulated database error';
          mockDb.prepare.mockImplementation(() => {
              throw new Error(errorMessage);
          });

          await expect(issueService.getAllIssues()).rejects.toThrowError(`Failed to get all issues: ${errorMessage}`);
      });

      it('should return an empty array if no issues exist', async () => {
          mockGetAllIssuesSuccess([]); // Mock to return an empty array
          const retrievedIssues = await issueService.getAllIssues();
          expect(retrievedIssues).toEqual([]);
      });
  });


    describe('getIssueById', () => {
        it('should retrieve an issue by ID successfully', async () => {
            mockGetIssueByIdSuccess(sampleIssue);

            const retrievedIssue = await issueService.getIssueById(sampleIssue.id);
            expect(retrievedIssue).toEqual(sampleIssue);
            expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM issues WHERE id = ?'));
        });

        it('should return undefined if issue is not found', async () => {
            const preparedStmt = {
                get: vi.fn().mockReturnValue(undefined),
            };
            mockDb.prepare.mockReturnValue(preparedStmt);
            const retrievedIssue = await issueService.getIssueById('nonexistent-id');
            expect(retrievedIssue).toBeUndefined();
        });

        it('should handle errors during getIssueById', async () => {
            const errorMessage = 'Simulated database error';
            mockDb.prepare.mockImplementation(() => {
                throw new Error(errorMessage);
            });

            await expect(issueService.getIssueById(sampleIssue.id)).rejects.toThrowError(`Failed to get issue by ID: ${errorMessage}`);
        });
    });


    describe('updateIssue', () => {
        it('should update an issue successfully', async () => {
            const updatedIssue: Issue = { ...sampleIssue, title: 'Updated Title' };
            mockGetIssueByIdSuccess(updatedIssue); // Mock for getIssueById to return the updated issue
            mockDb.exec.mockImplementation((sql: string) => {
              if (sql.startsWith('BEGIN')) return;
              if (sql.startsWith('COMMIT')) return;
              if (sql.startsWith('ROLLBACK')) return;
            });

            const returnedIssue = await issueService.updateIssue(updatedIssue);
            expect(returnedIssue).toEqual(updatedIssue);
            expect(mockDb.prepare).toHaveBeenCalledTimes(4); // UPDATE issue, insert/replace user (reporter & assignee), delete comments, insert comments
            expect(mockDb.exec).toHaveBeenCalledTimes(2); // BEGIN and COMMIT
        });

        it('should handle errors during issue update', async () => {
            const errorMessage = 'Simulated database error';
            mockDb.exec.mockImplementation(() => {
                throw new Error(errorMessage);
            });

            await expect(issueService.updateIssue(sampleIssue)).rejects.toThrowError(`Failed to update issue: ${errorMessage}`);
            expect(mockDb.exec).toHaveBeenCalledWith('ROLLBACK'); // Ensure rollback on error
        });

        it('should handle null or undefined assignee during update', async () => {
          const issueWithoutAssignee = { ...sampleIssue, assignee: undefined };
          mockGetIssueByIdSuccess(issueWithoutAssignee); // Mock for getIssueById to return the updated issue
          mockDb.exec.mockImplementation((sql: string) => {
            if (sql.startsWith('BEGIN')) return;
            if (sql.startsWith('COMMIT')) return;
            if (sql.startsWith('ROLLBACK')) return;
          });

          const updatedIssue = await issueService.updateIssue(issueWithoutAssignee);

          expect(updatedIssue).toEqual(issueWithoutAssignee);
          expect(mockDb.prepare).toHaveBeenCalledTimes(3); // UPDATE issue, insert/replace user (reporter), delete comments, and insert comment(s)
        });

        it('should handle empty labels during update', async () => {
            const issueWithEmptyLabels = { ...sampleIssue, labels: [] };
            mockGetIssueByIdSuccess(issueWithEmptyLabels);
            mockDb.exec.mockImplementation((sql: string) => {
              if (sql.startsWith('BEGIN')) return;
              if (sql.startsWith('COMMIT')) return;
              if (sql.startsWith('ROLLBACK')) return;
            });

            const updatedIssue = await issueService.updateIssue(issueWithEmptyLabels);

            expect(updatedIssue).toEqual(issueWithEmptyLabels);
            expect(mockDb.prepare).toHaveBeenCalledTimes(4);
        });
    });

    describe('deleteIssue', () => {
        it('should delete an issue successfully', async () => {
            const preparedStmt = {
                run: vi.fn(),
            };
            mockDb.prepare.mockReturnValue(preparedStmt);

            await issueService.deleteIssue(sampleIssue.id);
            expect(preparedStmt.run).toHaveBeenCalledWith(sampleIssue.id);
            expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM issues WHERE id = ?'));
        });

        it('should handle errors during issue deletion', async () => {
            const errorMessage = 'Simulated database error';
            mockDb.prepare.mockImplementation(() => {
                throw new Error(errorMessage);
            });

            await expect(issueService.deleteIssue(sampleIssue.id)).rejects.toThrowError(`Failed to delete issue: ${errorMessage}`);
        });
    });
});