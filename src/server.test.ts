import request from 'supertest';
import app from './app'; // Assuming your Express app is exported from app.ts
import express from 'express';

const server = express(); // Create an express app instance to be used for testing

server.get('/', (req, res) => {
  res.status(200).send('Hello, world!');
});

describe('Server', () => {
  it('should start successfully and respond on the root path', async () => {
    const response = await request(server).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Hello, world!');
  });
});
