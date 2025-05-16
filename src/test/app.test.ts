import request from 'supertest';
// Assuming your Express app instance is exported from a file named 'app.ts' in the src directory
// Adjust the import path below if your app instance is located elsewhere
import app from '../app'; // Adjust this path according to your project structure

describe('GET /', () => {
  it('should return 200 OK and "Hello World"', async () => {
    await request(app)
      .get('/')
      .expect(200)
      .expect('Hello World');
  });
});
