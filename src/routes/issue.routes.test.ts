import request from 'supertest';
import express, { Application } from 'express';
import { issueRoutes } from './issue.routes';
import * as issueController from '../controllers/issue.controller';

// Mock the issue controller functions
jest.mock('../controllers/issue.controller', () => ({
    createIssue: jest.fn(),
    getIssue: jest.fn(),
    deleteIssue: jest.fn(),
}));

describe('Issue Routes', () => {
    let app: Application;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use(issueRoutes);
        jest.clearAllMocks();
    });

    it('POST /rest/api/2/issue should call createIssue', async () => {
        (issueController.createIssue as jest.Mock).mockImplementation(async (req, res, next) => {
            res.status(201).send(); // Simulate successful creation
        });

        const response = await request(app).post('/rest/api/2/issue').send({ /* issue data */ });
        expect(issueController.createIssue).toHaveBeenCalled();
        expect(response.status).toBe(201);
    });

    it('GET /rest/api/2/issue/{issueKey} should call getIssue', async () => {
        const issueKey = 'TEST-123';
        (issueController.getIssue as jest.Mock).mockImplementation(async (req, res, next) => {
            res.status(200).send({ key: issueKey }); // Simulate successful retrieval
        });

        const response = await request(app).get(`/rest/api/2/issue/${issueKey}`);
        expect(issueController.getIssue).toHaveBeenCalled();
        expect(response.status).toBe(200);
        expect(response.body.key).toBe(issueKey);
    });

    it('DELETE /rest/api/2/issue/{issueKey} should call deleteIssue', async () => {
        const issueKey = 'TEST-123';
        (issueController.deleteIssue as jest.Mock).mockImplementation(async (req, res, next) => {
            res.status(204).send(); // Simulate successful deletion
        });

        const response = await request(app).delete(`/rest/api/2/issue/${issueKey}`);
        expect(issueController.deleteIssue).toHaveBeenCalled();
        expect(response.status).toBe(204);
    });

    it('Should handle errors and call next', async () => {
        const errorMessage = 'Simulated error';
        (issueController.createIssue as jest.Mock).mockImplementation(async (req, res, next) => {
            next(new Error(errorMessage));
        });

        const response = await request(app).post('/rest/api/2/issue');

        // Check that the response is an error (e.g., 500)
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(issueController.createIssue).toHaveBeenCalled();
    });
});
