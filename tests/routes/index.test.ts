// tests/routes/index.test.ts

import request from 'supertest';
import express from 'express';
import { router } from '../../src/routes/index'; // Assuming an index.ts for your routes

const app = express();
app.use(express.json()); // Middleware to parse JSON bodies
app.use('/', router);

describe('API Endpoints', () => {
  it('GET / should return 200 OK', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toEqual(200);
  });

  it('POST / should return 201 Created', async () => {
    const res = await request(app).post('/').send({ test: 'data' });
    expect(res.statusCode).toEqual(201);
    // Add more assertions based on the expected response
  });

  it('PUT /:id should return 200 OK', async () => {
    const res = await request(app).put('/1').send({ updated: 'data' });
    expect(res.statusCode).toEqual(200);
    // Add more assertions based on the expected response
  });

  it('DELETE /:id should return 200 OK', async () => {
    const res = await request(app).delete('/1');
    expect(res.statusCode).toEqual(200);
    // Add more assertions based on the expected response
  });
});