import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import issueRoutes from '../routes/issueRoutes';
import { IssueController } from './issueController';
import { DatabaseService } from '../../services/databaseService';
import { IssueKeyService } from '../../services/issueKeyService';
import { IssueStatusTransitionService } from '../../services/issueStatusTransitionService';

jest.mock('./issueController');

describe('issueRoutes', () => {
    let app: express.Application;
    const mockIssueController = new IssueController(
        {} as DatabaseService,
        {} as IssueKeyService,
        {} as IssueStatusTransitionService
    );

    beforeAll(() => {
        app = express();
        app.use(express.json());
        app.use((req: Request, res: Response, next: NextFunction) => {
            req.issueKeyService = {} as IssueKeyService;
            next();
        });
        app.use('/', issueRoutes);

        // Override the actual implementation with the mock
        (IssueController as jest.Mock<IssueController>).mockImplementation(() => mockIssueController);
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /', () => {
        it('should call createIssue controller and return 201 status code if successful', async () => {
            (mockIssueController.createIssue as jest.Mock).mockImplementation((req: Request, res: Response) => {
                res.status(201).json({ message: 'Issue created successfully' });
                return Promise.resolve();
            });

            const response = await request(app)
                .post('/')
                .send({
                    issuetype: 'Bug',
                    summary: 'Test issue',
                    description: 'Test description',
                    key: 'TEST-1'
                });

            expect(mockIssueController.createIssue).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(201);
            expect(response.body).toEqual({ message: 'Issue created successfully' });
        });

        it('should return 500 status code if createIssue controller fails', async () => {
             (mockIssueController.createIssue as jest.Mock).mockImplementation((req: Request, res: Response) => {
                res.status(500).json({ message: 'Failed to create issue' });
                return Promise.resolve();
            });

            const response = await request(app)
                .post('/')
                .send({
                    issuetype: 'Bug',
                    summary: 'Test issue',
                    description: 'Test description',
                    key: 'TEST-1'
                });

            expect(mockIssueController.createIssue).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Failed to create issue' });
        });
    });

    describe('GET /:issueIdOrKey', () => {
        it('should call getIssue controller and return 200 status code if successful', async () => {
             (mockIssueController.getIssue as jest.Mock).mockImplementation((req: Request, res: Response) => {
                res.status(200).json({ message: 'Issue retrieved successfully' });
                return Promise.resolve();
            });

            const response = await request(app).get('/123');

            expect(mockIssueController.getIssue).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(200);
            expect(response.body).toEqual({ message: 'Issue retrieved successfully' });
        });

        it('should return 404 status code if getIssue controller returns issue not found', async () => {
             (mockIssueController.getIssue as jest.Mock).mockImplementation((req: Request, res: Response) => {
                res.status(404).json({ message: 'Issue not found' });
                 return Promise.resolve();
            });

            const response = await request(app).get('/123');

            expect(mockIssueController.getIssue).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: 'Issue not found' });
        });

        it('should return 500 status code if getIssue controller fails', async () => {
             (mockIssueController.getIssue as jest.Mock).mockImplementation((req: Request, res: Response) => {
                res.status(500).json({ message: 'Failed to retrieve issue' });
                return Promise.resolve();
            });

            const response = await request(app).get('/123');

            expect(mockIssueController.getIssue).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Failed to retrieve issue' });
        });
    });

    describe('PUT /:issueIdOrKey', () => {
        it('should call updateIssue controller and return 204 status code if successful', async () => {
            (mockIssueController.updateIssue as jest.Mock).mockImplementation((req: Request, res: Response) => {
                res.status(204).send();
                return Promise.resolve();
            });

            const response = await request(app)
                .put('/123')
                .send({ summary: 'Updated issue summary' });

            expect(mockIssueController.updateIssue).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(204);
            expect(response.body).toEqual({});
        });

        it('should return 404 status code if updateIssue controller returns issue not found', async () => {
             (mockIssueController.updateIssue as jest.Mock).mockImplementation((req: Request, res: Response) => {
                res.status(404).json({ message: 'Issue not found' });
                 return Promise.resolve();
            });

            const response = await request(app)
                .put('/123')
                .send({ summary: 'Updated issue summary' });

            expect(mockIssueController.updateIssue).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: 'Issue not found' });
        });

        it('should return 500 status code if updateIssue controller fails', async () => {
             (mockIssueController.updateIssue as jest.Mock).mockImplementation((req: Request, res: Response) => {
                res.status(500).json({ message: 'Failed to update issue' });
                return Promise.resolve();
            });

            const response = await request(app)
                .put('/123')
                .send({ summary: 'Updated issue summary' });

            expect(mockIssueController.updateIssue).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Failed to update issue' });
        });
    });

    describe('DELETE /:issueIdOrKey', () => {
        it('should call deleteIssue controller and return 204 status code if successful', async () => {
             (mockIssueController.deleteIssue as jest.Mock).mockImplementation((req: Request, res: Response) => {
                res.status(204).send();
                return Promise.resolve();
            });

            const response = await request(app).delete('/123');

            expect(mockIssueController.deleteIssue).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(204);
             expect(response.body).toEqual({});
        });

        it('should return 404 status code if deleteIssue controller returns issue not found', async () => {
             (mockIssueController.deleteIssue as jest.Mock).mockImplementation((req: Request, res: Response) => {
                res.status(404).json({ message: 'Issue not found' });
                 return Promise.resolve();
            });

            const response = await request(app).delete('/123');

            expect(mockIssueController.deleteIssue).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(404);
            expect(response.body).toEqual({ message: 'Issue not found' });
        });

        it('should return 500 status code if deleteIssue controller fails', async () => {
             (mockIssueController.deleteIssue as jest.Mock).mockImplementation((req: Request, res: Response) => {
                res.status(500).json({ message: 'Failed to delete issue' });
                return Promise.resolve();
            });

            const response = await request(app).delete('/123');

            expect(mockIssueController.deleteIssue).toHaveBeenCalledTimes(1);
            expect(response.status).toBe(500);
            expect(response.body).toEqual({ message: 'Failed to delete issue' });
        });
    });
});