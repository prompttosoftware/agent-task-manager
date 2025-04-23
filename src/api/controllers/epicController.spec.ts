import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import epicRoutes from '../routes/epicRoutes';
import { getEpics } from './epicController';
import { Issue } from '../../models/issue'; // Import the Issue interface

// Mock the Issue model and its findAll method
jest.mock('../../models/issue', () => {
    const mockIssue = {
        findAll: jest.fn(),
    };
    return { Issue: mockIssue }; // Return the mockIssue as the Issue export
});

describe('epicController', () => {
    let app: express.Application;
    let mockFindAll: jest.Mock;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/', epicRoutes);

        // Reset the mock implementation before each test
        mockFindAll = (Issue as any).Issue.findAll as jest.Mock;
        mockFindAll.mockReset();
    });

    it('should return a 200 status code and a list of epics on successful GET /', async () => {
        // Arrange: Mock the findAll method to return some epics
        const mockEpics: Issue[] = [
            { _id: '1', issuetype: 'Epic', summary: 'Epic 1', description: 'Description 1', key: 'EPIC-1' },
            { _id: '2', issuetype: 'Epic', summary: 'Epic 2', description: 'Description 2', key: 'EPIC-2' },
        ];
        mockFindAll.mockResolvedValue(mockEpics);

        // Act: Make a GET request to the endpoint
        const response = await request(app).get('/');

        // Assert: Check the status code and the response body
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(mockEpics);

        // Verify: Ensure that the findAll method was called with the correct arguments
        expect(mockFindAll).toHaveBeenCalledWith({ where: { issueTypeId: 1 } });
    });

    it('should return a 200 status code and an empty array if no epics are found', async () => {
        // Arrange: Mock the findAll method to return an empty array
        mockFindAll.mockResolvedValue([]);

        // Act: Make a GET request to the endpoint
        const response = await request(app).get('/');

        // Assert: Check the status code and the response body
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual([]);

        // Verify: Ensure that the findAll method was called with the correct arguments
        expect(mockFindAll).toHaveBeenCalledWith({ where: { issueTypeId: 1 } });
    });

    it('should return a 500 status code and an error message if an error occurs during fetching epics', async () => {
        // Arrange: Mock the findAll method to throw an error
        mockFindAll.mockRejectedValue(new Error('Failed to fetch epics'));

        // Mock error handler
        app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
            console.error(err.stack);
            res.status(500).send({ error: 'Something broke!' });
        });

        // Act: Make a GET request to the endpoint
        const response = await request(app).get('/');

        // Assert: Check the status code and the response body
        expect(response.statusCode).toBe(500);
        expect(response.body).toEqual({ error: 'Something broke!' });

        // Verify: Ensure that the findAll method was called with the correct arguments
        expect(mockFindAll).toHaveBeenCalledWith({ where: { issueTypeId: 1 } });
    });

    it('should handle multiple epics correctly', async () => {
        // Arrange
        const mockEpics: Issue[] = [
            { _id: '1', issuetype: 'Epic', summary: 'Epic 1', description: 'Description 1', key: 'EPIC-1' },
            { _id: '2', issuetype: 'Epic', summary: 'Epic 2', description: 'Description 2', key: 'EPIC-2' },
            { _id: '3', issuetype: 'Epic', summary: 'Epic 3', description: 'Description 3', key: 'EPIC-3' },
        ];
        mockFindAll.mockResolvedValue(mockEpics);

        // Act
        const response = await request(app).get('/');

        // Assert
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(mockEpics);
        expect(mockFindAll).toHaveBeenCalledWith({ where: { issueTypeId: 1 } });
    });

    it('should handle the case where the database returns null', async () => {
        // Arrange
        mockFindAll.mockResolvedValue(null);

        // Act
        const response = await request(app).get('/');

        // Assert
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(null); // Or handle however you want to treat null responses
        expect(mockFindAll).toHaveBeenCalledWith({ where: { issueTypeId: 1 } });
    });

});