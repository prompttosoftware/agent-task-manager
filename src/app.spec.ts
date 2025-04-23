import request from 'supertest';
import express, { Request, Response, NextFunction, Router } from 'express';

// --- Mock Dependencies --- 
// Mock routers *before* importing the app module.
// This prevents actual route logic but allows testing mounting.

const createMockRouter = (name: string): Router => {
  const router = Router();
  // Add a simple test route to identify the router via GET
  router.get(`/${name}-test`, (req: Request, res: Response) => { // Explicit types for handler
    res.status(200).send({ router: name });
  });
  // Add a POST handler that echoes the body to test JSON parsing
  router.post(`/${name}-post-test`, (req: Request, res: Response) => { // Explicit types for handler
    if (req.body && Object.keys(req.body).length > 0) {
      res.status(200).send({ receivedBody: req.body });
    } else {
      res.status(400).send({ error: 'No body received by mock' });
    }
  });
  // Generic catch-all for other methods/paths within this router
  router.use((req: Request, res: Response, next: NextFunction) => { // Explicit types for handler
    // Simulate endpoint found but maybe method not allowed or just acknowledge path
    // For mounting tests, if the GET route wasn't hit, this mock should 404
    res.status(404).send({ message: `Mock route ${name} path ${req.path} reached, but not handled by mock GET/POST` });
  });
  return router;
};

jest.mock('./api/routes/issueRoutes', () => ({ __esModule: true, default: createMockRouter('issue') }));
jest.mock('./api/routes/issueLinkRoutes', () => ({ __esModule: true, default: createMockRouter('issueLink') }));
jest.mock('./api/routes/epicRoutes', () => ({ __esModule: true, default: createMockRouter('epic') }));
jest.mock('./api/routes/metadataRoutes', () => ({ __esModule: true, default: createMockRouter('metadata') }));

// Mock request logger to verify it's called without executing its real logic
const mockRequestLogger = jest.fn((req: Request, res: Response, next: NextFunction) => next());
jest.mock('./api/middleware/requestLogger', () => ({
  __esModule: true,
  default: mockRequestLogger,
}));

// --- Import App --- 
// Import the app *after* mocks are set up
import { app } from './app';
// Import the actual error handler for direct testing
import errorHandler from './api/middleware/errorHandler';

// --- Tests --- 
describe('App Integration Tests', () => {
  beforeEach(() => {
    // Reset call counts for the logger mock before each test
    mockRequestLogger.mockClear();
  });

  it('should use requestLogger middleware for incoming requests', async () => {
    await request(app).get('/any-route-for-logger-test'); // Hit an arbitrary route
    // Check if the mock logger was called
    expect(mockRequestLogger).toHaveBeenCalled();
  });

  it('should parse JSON request bodies', async () => {
    const testData = { message: 'Hello JSON!' };
    const response = await request(app)
       .post('/rest/api/3/issue/issue-post-test') // Hit the specific POST test route in the mock
       .send(testData)
       .set('Content-Type', 'application/json');

    // Expect the mock router's POST handler to have received and echoed the body
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ receivedBody: testData });
  });

  // Test mounting of each router by hitting its specific test endpoint
  it('should mount issueRoutes at /rest/api/3/issue', async () => {
    const response = await request(app).get('/rest/api/3/issue/issue-test');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ router: 'issue' });
  });

  it('should mount issueLinkRoutes at /rest/api/3/issue-link', async () => {
    const response = await request(app).get('/rest/api/3/issue-link/issueLink-test');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ router: 'issueLink' });
  });

  it('should mount epicRoutes at /rest/api/3/epic', async () => {
    const response = await request(app).get('/rest/api/3/epic/epic-test');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ router: 'epic' });
  });

  it('should mount issueRoutes (again) at /rest/api/3/search', async () => {
    const response = await request(app).get('/rest/api/3/search/issue-test');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ router: 'issue' }); // Should be handled by the 'issue' mock router
  });

  it('should mount metadataRoutes at /rest/api/3/metadata', async () => {
    // Request path updated to reflect the change in app.ts
    const response = await request(app).get('/rest/api/3/metadata/metadata-test'); 
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ router: 'metadata' }); // Should be handled by the 'metadata' mock router
  });


  it('should return a default 404 for unhandled routes', async () => {
    const response = await request(app).get('/non-existent-route-abcdef');
    expect(response.status).toBe(404);
    // Express default 404 handler sends HTML or plain text, not JSON from our custom handler
    expect(response.headers['content-type']).toMatch(/html|text/); // Check content type is not JSON
    expect(response.text).toMatch(/Cannot GET \/non-existent-route-abcdef/i); // Check text content
    // Default express 404 often results in an empty body when testing with supertest if content-type isn't json
    expect(response.body).toEqual({}); 
  });

  // Test the errorHandler in isolation
  it('should use the custom errorHandler format when next(err) is called', async () => {
    // Create a minimal app instance specifically for this test
    const testApp = express();
    const testError = new Error('Test Error Triggered');

    // Add a route that explicitly calls next() with an error
    testApp.get('/test-error-trigger', (req, res, next) => {
      next(testError);
    });

    // Add the *actual* errorHandler middleware (imported)
    testApp.use(errorHandler);

    // Make a request to the test app
    const response = await request(testApp).get('/test-error-trigger');

    // Assertions based on errorHandler.ts format
    expect(response.status).toBe(500); // Default status code from errorHandler
    expect(response.body).toEqual({
      errorMessages: ['Test Error Triggered'],
      errors: {}, // errorHandler initializes errors to {} if not provided
    });
  });

});
