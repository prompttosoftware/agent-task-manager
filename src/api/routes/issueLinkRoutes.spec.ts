import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import issueLinkRoutes from './issueLinkRoutes';
import { issueController } from '../controllers/issueController';

// Mock the issueController and its methods
jest.mock('../controllers/issueController', () => {
    const mockLinkIssues = jest.fn((req: Request, res: Response, next: NextFunction) => {
        res.status(200).json({ message: 'linkIssues called' });
    });
    return {
        issueController: {
            linkIssues: mockLinkIssues,
        },
    };
});

describe('issueLinkRoutes', () => {
    let app: express.Application;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/', issueLinkRoutes);
    });

    it('POST / should call issueController.linkIssues', async () => {
        const response = await request(app)
            .post('/')
            .send({ issueIdOrKey: '123', linkedIssueKey: '456', linkType: 'relates to' });

        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ message: 'linkIssues called' });
        expect(issueController.linkIssues).toHaveBeenCalledTimes(1);
    });
});