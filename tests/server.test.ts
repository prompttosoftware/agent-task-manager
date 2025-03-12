// tests/server.test.ts

import request from 'supertest';
import app from '../src/server'; // Assuming your app is exported from server.ts

describe('Server Initialization', () => {
  it('should start the server and listen on the specified port', async () => {
    // This is a basic test to check if the server starts without throwing errors.
    // You might need to adjust this based on how your server is set up.
    const response = await request(app).get('/'); // Assuming your server has a default route
    expect(response.statusCode).not.toEqual(404); // Or any other expected status code
  });
});
