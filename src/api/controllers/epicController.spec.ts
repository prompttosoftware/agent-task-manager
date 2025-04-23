import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import epicRoutes from '../routes/epicRoutes';
import { getEpics } from './epicController';

// Mock the epicController to prevent actual database calls and verify calls
jest.mock('./epicController', () => ({
    getEpics: jest.fn((req: Request, res: Response, next: NextFunction) => {
        res.status(200).json([{ id: 1, name: 'Test Epic' }]);
    }),
}));

describe('epicRoutes', () => {
    let app: express.Application;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/', epicRoutes);
    });

    it('should return a 200 status code for GET /', async () => {
        const response = await request(app).get('/');
        expect(response.statusCode).toBe(200);
    });

    it('should call the getEpics controller function for GET /', async () => {
        await request(app).get('/');
        expect(getEpics).toHaveBeenCalled();
    });

});