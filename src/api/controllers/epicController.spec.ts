import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import epicRoutes from '../routes/epicRoutes';
import { Issue } from '../../models/issue';

// Mock the Issue model and its create method
jest.mock('../../models/issue', () => {
    const mockIssue = {
        create: jest.fn(),
        findAll: jest.fn() // Ensure findAll is also mocked for other tests
    };
    return { Issue: mockIssue };
});

describe('Epic Controller - POST /', () => {
    let app: express.Application;
    let mockCreate: jest.Mock;
    let mockFindAll: jest.Mock;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/', epicRoutes);

        // Reset the mock implementation before each test
        mockCreate = (Issue as any).Issue.create as jest.Mock;
        mockCreate.mockReset();
        mockFindAll = (Issue as any).Issue.findAll as jest.Mock;
        mockFindAll.mockReset();
    });

    it('should return a 201 status code and the created epic data on successful creation', async () => {
        // Arrange: Mock the create method to simulate a successful creation
        const newEpic: Issue = {
            _id: 'new-epic-id',
            issuetype: 'Epic',
            summary: 'New Epic',
            description: 'New Epic Description',
            key: 'NEW-EPIC-1',
        };
        mockCreate.mockResolvedValue(newEpic);

        // Act: Make a POST request to the endpoint
        const response = await request(app)
            .post('/')
            .send(newEpic);

        // Assert: Check the status code and the response body
        expect(response.statusCode).toBe(201);
        expect(response.body).toEqual(newEpic);

        // Verify: Ensure that the create method was called with the correct arguments
        expect(mockCreate).toHaveBeenCalledWith(newEpic);
    });

    it('should return a 500 status code and an error message if epic creation fails', async () => {
        // Arrange: Mock the create method to throw an error
        mockCreate.mockRejectedValue(new Error('Epic creation failed'));

        //Mock error handler to catch errors
        app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
            console.error(err.stack)
            res.status(500).send({ message: 'Epic creation failed' });
        });

        // Act: Make a POST request to the endpoint
        const newEpic: Issue = {
            _id: 'new-epic-id',
            issuetype: 'Epic',
            summary: 'New Epic',
            description: 'New Epic Description',
            key: 'NEW-EPIC-1',
        };

        const response = await request(app)
            .post('/')
            .send(newEpic);

        // Assert: Check the status code and the response body
        expect(response.statusCode).toBe(500);
        expect(response.body).toEqual({ message: 'Epic creation failed' });

        // Verify: Ensure that the create method was called with the correct arguments
        expect(mockCreate).toHaveBeenCalledWith(newEpic);
    });
});

describe('Epic Controller - GET /', () => {
    let app: express.Application;
    let mockFindAll: jest.Mock;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/', epicRoutes);

        mockFindAll = (Issue as any).Issue.findAll as jest.Mock;
        mockFindAll.mockReset();

        //Mock error handler to catch errors
        app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
            console.error(err.stack)
            res.status(500).send({ message: 'Failed to retrieve epics' });
        });
    });

    it('should return a 200 status code and the list of epics when successful', async () => {
        // Arrange: Mock the findAll method to simulate a successful retrieval
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
        mockFindAll.mockResolvedValue(epics);

        // Act: Make a GET request to the endpoint
        const response = await request(app)
            .get('/');

        // Assert: Check the status code and the response body
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(epics);

        // Verify: Ensure that the findAll method was called
        expect(mockFindAll).toHaveBeenCalled();
    });

    it('should return a 500 status code when Issue.findAll method fails', async () => {
        // Arrange: Mock the findAll method to throw an error
        mockFindAll.mockRejectedValue(new Error('Failed to retrieve epics'));


        // Act: Make a GET request to the endpoint
        const response = await request(app)
            .get('/');

        // Assert: Check the status code and the response body
        expect(response.statusCode).toBe(500);
        expect(response.body).toEqual({ message: 'Failed to retrieve epics' });

        // Verify: Ensure that the findAll method was called
        expect(mockFindAll).toHaveBeenCalled();
    });
});