import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { EpicController } from './epicController';
import { DatabaseService } from '../../services/databaseService';
import { IssueKeyService } from '../../services/issueKeyService';
import { Issue } from '../../models/issue';
import { IssueResponse } from '../../utils/jsonTransformer';
import { triggerWebhooks } from '../../services/webhookService';

// Mock the services
jest.mock('../../services/databaseService');
jest.mock('../../services/issueKeyService');
jest.mock('../../services/webhookService');

import { getDBConnection } from '../../config/db';
import { initializeDatabaseSchema } from '../../config/databaseSchema';
import { databaseService } from '../../services/database';

describe('Epic Controller', () => {
    jest.setTimeout(30000);

    let app: express.Application;
    let epicController: EpicController;
    let mockDatabaseService: jest.Mocked<DatabaseService>;
    let mockIssueKeyService: jest.Mocked<IssueKeyService>;
    let mockTriggerWebhooks: jest.Mock;

    beforeAll(async () => {
            const db = await getDBConnection();
            await databaseService.connect(db);
            await initializeDatabaseSchema(databaseService);
    });

    beforeEach(() => {
        // Initialize mocks
        mockDatabaseService = jest.mocked(databaseService);
        mockIssueKeyService = jest.mocked(new IssueKeyService(mockDatabaseService));
        mockTriggerWebhooks = triggerWebhooks as jest.Mock;

        // Clear mocks to ensure clean state
        jest.clearAllMocks();

        // Initialize the controller with the mocks
        epicController = new EpicController(mockDatabaseService, mockIssueKeyService);

        // Initialize the express app and add middleware
        app = express();
        app.use(express.json()); // For parsing application/json

        // Define a test route that uses the controller
        app.post('/epics', epicController.createEpic.bind(epicController));
        app.get('/epics', epicController.getEpics.bind(epicController));

        // Add a generic error handler for tests
        app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
            console.error("Test Error Handler Caught:", err.stack);
            const message = err.message || 'Internal Server Error';
            // Use a default status if none is attached to the error
            const status = (err as any).status || 500;
            res.status(status).json({ message });
        });
    });

    describe('POST /epics', () => {
        it('should return a 201 status code and the created epic data formatted as IssueResponse on successful creation', async () => {
            // Arrange: Mock the services to simulate a successful epic creation
            const createdEpic: Issue = {
                _id: 'mock-mongo-id-12345',
                issuetype: 'Epic',
                summary: 'New Epic',
                description: 'New Epic Description',
                key: 'PROJ-123'
            };

            mockIssueKeyService.getNextIssueKey.mockResolvedValue('PROJ-123');
            mockDatabaseService.run.mockResolvedValue(undefined); // Simulate successful insertion
            mockDatabaseService.get.mockResolvedValue(createdEpic);
            mockTriggerWebhooks.mockResolvedValue(undefined); // Mock webhook trigger

            // 1. Define the expected response based on IssueResponse
            const expectedResponse: IssueResponse = {
                expand: "schema,names",
                id: createdEpic._id,
                key: createdEpic.key,
                self: `/rest/api/3/issue/${createdEpic.key}`,
                fields: {
                    summary: createdEpic.summary,
                },
                summary: createdEpic.summary,
            };

            // Act: Send a POST request to create an epic
            const response = await request(app)
                .post('/epics')
                .send({
                    summary: createdEpic.summary,
                    description: createdEpic.description
                });

            // Assert: Check the status code and the response body
            expect(response.statusCode).toBe(201);
            // 2. Modify the assertion to use expectedResponse
            expect(response.body).toEqual(expectedResponse); // Response should match the formatted structure

            // Verify: Ensure that the service methods were called correctly
            expect(mockIssueKeyService.getNextIssueKey).toHaveBeenCalled();
            expect(mockDatabaseService.run).toHaveBeenCalled();
            expect(mockTriggerWebhooks).toHaveBeenCalled();
        });

        it('should return a 500 status code if generating the issue key fails', async () => {
            // Arrange: Mock the IssueKeyService to reject with an error
            mockIssueKeyService.getNextIssueKey.mockRejectedValue(new Error('Failed to generate issue key'));
            mockTriggerWebhooks.mockResolvedValue(undefined);

            // Act: Send a POST request to create an epic
            const response = await request(app)
                .post('/epics')
                .send({
                    summary: 'New Epic',
                    description: 'New Epic Description'
                });

            // Assert: Check the status code and the error message
            expect(response.statusCode).toBe(500);
            // 1. Modify the assertion to expect the correct error message
            expect(response.body).toEqual({ message: 'Failed to create epic: Failed to generate issue key' });
            expect(mockDatabaseService.run).not.toHaveBeenCalled(); // Database should not be hit
            expect(mockDatabaseService.get).not.toHaveBeenCalled(); // Should not attempt to fetch
            // 2. Ensure formatIssueResponse is not called (implicitly tested by checking the error response structure)
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        });

        it('should return a 500 status code and an error message if database insertion fails', async () => {
            // Arrange: Mock the DatabaseService to reject with an error during insertion
            const dbErrorMessage = 'Database error during epic creation';
            mockIssueKeyService.getNextIssueKey.mockResolvedValue('PROJ-123');
            mockDatabaseService.run.mockRejectedValue(new Error(dbErrorMessage));
            mockTriggerWebhooks.mockResolvedValue(undefined);

            // Act: Send a POST request to create an epic
            const response = await request(app)
                .post('/epics')
                .send({
                    summary: 'New Epic',
                    description: 'New Epic Description'
                });

            // Assert: Check the status code and the error message
            expect(response.statusCode).toBe(500);
            // 1. Modify the assertion to expect the correct error message
            // The controller wraps the original error message from the database service.
            expect(response.body).toEqual({ message: 'Failed to create epic: Database error during epic creation' });

            // Verify: Ensure key generation was attempted but get was not
            expect(mockIssueKeyService.getNextIssueKey).toHaveBeenCalled();
            expect(mockDatabaseService.get).not.toHaveBeenCalled();
            expect(mockTriggerWebhooks).not.toHaveBeenCalled();
        });
    });

    describe('GET /epics', () => {
        it('should return a 200 status code and the list of epics formatted as IssueResponse when successful', async () => {
            // Arrange: Mock the DatabaseService to return a list of epics
            const epics: Issue[] = [
                { _id: 'epic-id-1', issuetype: 'Epic', summary: 'Epic 1', description: 'Epic Description 1', key: 'EPIC-1' },
                { _id: 'epic-id-2', issuetype: 'Epic', summary: 'Epic 2', description: 'Epic Description 2', key: 'EPIC-2' }
            ];

            mockDatabaseService.all.mockResolvedValue(epics);
            mockTriggerWebhooks.mockResolvedValue(undefined);

            // Define the expected response
            const expectedEpicsResponse: IssueResponse[] = epics.map(epic => ({
                expand: "schema,names",
                id: epic._id,
                key: epic.key,
                self: `/rest/api/3/issue/${epic.key}`,
                fields: {
                    summary: epic.summary,
                },
                summary: epic.summary,
            }));

            // Act: Send a GET request to retrieve epics
            const response = await request(app).get('/epics');

            // Assert: Check the status code and the response body
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(expectedEpicsResponse); // Expect formatted response

            // Verify: Ensure that the 'all' method was called with the correct query/filter
            expect(mockDatabaseService.all).toHaveBeenCalledWith(
                'SELECT * FROM issues WHERE issuetype = ?',
                ['Epic']
            );
        });

        it('should return a 500 status code when database retrieval fails', async () => {
            // Arrange: Mock the DatabaseService to reject with an error during retrieval
            const dbErrorMessage = 'Database error during epic retrieval';
            mockDatabaseService.all.mockRejectedValue(new Error(dbErrorMessage));
            mockTriggerWebhooks.mockResolvedValue(undefined);

            // Act: Send a GET request to retrieve epics
            const response = await request(app).get('/epics');

            // Assert: Check the status code and the response body
            expect(response.statusCode).toBe(500);
            // The controller might wrap the original error message
            expect(response.body).toEqual({ message: 'Failed to retrieve epics: Database error during epic retrieval' });
        });
    });
});