import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import epicRoutes from '../routes/epicRoutes';
import { Issue } from '../../models/issue'; // Import the TYPE 'Issue'
import { DatabaseService } from '../../services/databaseService';
import { IssueKeyService } from '../../services/issueKeyService';
import { EpicController } from './epicController';
import { createMock } from '@golevelup/ts-jest';

// No need to mock '../../models/issue' directly as the controller uses services.

// Mock the services used by the controller
jest.mock('../../services/databaseService');
jest.mock('../../services/issueKeyService');

describe('Epic Controller', () => {
    let app: express.Application;
    let epicController: EpicController;
    let mockDatabaseService: jest.Mocked<DatabaseService>;
    let mockIssueKeyService: jest.Mocked<IssueKeyService>;

    beforeEach(() => {
        app = express();
        app.use(express.json());

        // Create deep mock instances of the services using @golevelup/ts-jest
        // This automatically mocks methods on the service instances.
        mockDatabaseService = createMock<DatabaseService>();
        mockIssueKeyService = createMock<IssueKeyService>();

        // Instantiate EpicController with mock dependencies
        epicController = new EpicController(mockDatabaseService, mockIssueKeyService);

        // Create the router with the instantiated controller
        const router = epicRoutes(epicController);
        app.use('/epics', router); // Mount routes at /epics (assuming epicRoutes defines routes relative to this)

        // Add a generic error handler for tests
        app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
            console.error("Test Error Handler Caught:", err.stack);
            const message = err.message || 'Internal Server Error';
            // Use a default status if none is attached to the error
            const status = (err as any).status || 500;
            res.status(status).send({ message });
        });
    });

    afterEach(() => {
        jest.resetAllMocks(); // Reset mocks between tests
    });

    describe('POST /epics', () => {
        it('should return a 201 status code and the created epic data on successful creation', async () => {
            // Arrange: Define the data sent in the request
            const newEpicData: Omit<Issue, '_id' | 'key' | 'issuetype'> = {
                summary: 'New Epic',
                description: 'New Epic Description',
                // projectId: 'PROJ' // Assuming projectId might be needed to generate key
            };
            const generatedKey = 'PROJ-123';
            const createdEpic: Issue = { // Expected structure of the created epic
                _id: expect.any(String), // Let the controller/service generate this
                issuetype: 'Epic',
                key: generatedKey,
                ...newEpicData,
                // Add any other default fields the controller might set
            };

            // Configure mock service responses
            mockIssueKeyService.getNextIssueKey.mockResolvedValue(generatedKey);
            // Mock run for the INSERT operation - doesn't return the inserted row directly
            mockDatabaseService.run.mockResolvedValue({ lastID: 1 }); // Simulate successful insert
            // Mock get for fetching the newly created epic by key (or maybe ID, depending on implementation)
            // The controller likely fetches the full object after insert to return it.
            // Let's assume it fetches by key after generating it.
            mockDatabaseService.get.mockResolvedValue(createdEpic);

            // Act: Make a POST request to the endpoint
            const response = await request(app)
                .post('/epics')
                .send(newEpicData); // Send the input data

            // Assert: Check the status code and the response body
            expect(response.statusCode).toBe(201);
            expect(response.body).toEqual(createdEpic); // Response should match the created object

            // Verify: Ensure that the service methods were called correctly
            expect(mockIssueKeyService.getNextIssueKey).toHaveBeenCalled(); // Add args check if possible, e.g., project prefix
            expect(mockDatabaseService.run).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO issues'), // Check if it's an INSERT query
                expect.arrayContaining([ // Check if the parameters match the input data + generated key/type
                    generatedKey,
                    'Epic',
                    newEpicData.summary,
                    newEpicData.description,
                    // Add other expected parameters based on the actual INSERT statement
                ])
            );
            // Verify that 'get' was called to retrieve the created epic, e.g., by key
            expect(mockDatabaseService.get).toHaveBeenCalledWith(
                expect.stringContaining('SELECT * FROM issues WHERE key = ?'),
                [generatedKey]
            );
        });

        it('should return a 500 status code if generating the issue key fails', async () => {
            // Arrange
            const newEpicData = { summary: 'Failing Key Epic', description: 'Key generation should fail' };
            const keyGenError = new Error('Failed to generate issue key');
            mockIssueKeyService.getNextIssueKey.mockRejectedValue(keyGenError);

            // Act
            const response = await request(app)
                .post('/epics')
                .send(newEpicData);

            // Assert
            expect(response.statusCode).toBe(500);
            expect(response.body).toEqual({ message: 'Failed to create epic: Failed to generate issue key' }); // Match controller's error message
            expect(mockDatabaseService.run).not.toHaveBeenCalled(); // Database should not be hit
        });

        it('should return a 500 status code and an error message if database insertion fails', async () => {
            // Arrange: Configure the mock 'run' method to reject with an error
            const newEpicData = { summary: 'Failing Insert Epic', description: 'This creation should fail' };
            const generatedKey = 'PROJ-124';
            const dbErrorMessage = 'Database error during epic creation';
            const dbError = new Error(dbErrorMessage);

            mockIssueKeyService.getNextIssueKey.mockResolvedValue(generatedKey);
            mockDatabaseService.run.mockRejectedValue(dbError);

            // Act: Make a POST request to the endpoint
            const response = await request(app)
                .post('/epics')
                .send(newEpicData);

            // Assert: Check the status code and the response body
            expect(response.statusCode).toBe(500);
            // The controller might wrap the original error message
            expect(response.body).toEqual({ message: `Failed to create epic: ${dbErrorMessage}` });

            // Verify: Ensure key generation was attempted but get was not
            expect(mockIssueKeyService.getNextIssueKey).toHaveBeenCalled();
            expect(mockDatabaseService.run).toHaveBeenCalled();
            expect(mockDatabaseService.get).not.toHaveBeenCalled();
        });
    });

    describe('GET /epics', () => {
        it('should return a 200 status code and the list of epics when successful', async () => {
            // Arrange: Mock the databaseService.all method to return a list of epics
            // Use the imported Issue TYPE for the array elements
            const epics: Issue[] = [
                {
                    _id: 'epic-id-1',
                    issuetype: 'Epic',
                    summary: 'Epic 1',
                    description: 'Epic Description 1',
                    key: 'EPIC-1',
                },
                {
                    _id: 'epic-id-2',
                    issuetype: 'Epic',
                    summary: 'Epic 2',
                    description: 'Epic Description 2',
                    key: 'EPIC-2',
                },
            ];
            // Configure mock 'all' to resolve with the list of epics
            mockDatabaseService.all.mockResolvedValue(epics);

            // Act: Make a GET request to the endpoint
            const response = await request(app)
                .get('/epics');

            // Assert: Check the status code and the response body
            expect(response.statusCode).toBe(200);
            expect(response.body).toEqual(epics);

            // Verify: Ensure that the 'all' method was called with the correct query/filter
            expect(mockDatabaseService.all).toHaveBeenCalledWith(
                expect.stringContaining("SELECT * FROM issues WHERE issuetype = ?"), // Check for the correct query
                ['Epic'] // Check for the correct parameter
            );
        });

        it('should return a 500 status code when database retrieval fails', async () => {
            // Arrange: Mock the 'all' method to throw an error
            const dbErrorMessage = 'Database connection lost';
            const error = new Error(dbErrorMessage);
            mockDatabaseService.all.mockRejectedValue(error);

            // Act: Make a GET request to the endpoint
            const response = await request(app)
                .get('/epics');

            // Assert: Check the status code and the response body
            expect(response.statusCode).toBe(500);
            // The controller might wrap the original error message
            expect(response.body).toEqual({ message: `Failed to retrieve epics: ${dbErrorMessage}` });

            // Verify: Ensure that the 'all' method was called
            expect(mockDatabaseService.all).toHaveBeenCalledWith(
                expect.stringContaining("SELECT * FROM issues WHERE issuetype = ?"),
                ['Epic']
            );
        });
    });
});