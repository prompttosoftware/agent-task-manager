// === relative import paths start ===
// ./issueRoutes.rateLimit.test.ts
// === relative import paths end ===

import request from 'supertest';
import express from 'express';
import type { Express, Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

// Define the endpoint path for issue creation.
// Assuming the path used in issueRoutes.ts for POST is '/issues'.
// If issueRoutes.ts exported a constant for this path, we could import it,
// e.g., import { ISSUES_ROUTE_PATH } from './issueRoutes';
// Using the string literal is common and sufficient if the path is fixed.
const ISSUE_PATH = '/issues';

// Configure a strict rate limit for testing purposes.
// We set a small windowMs and max value to quickly hit the limit in tests.
const testRateLimitConfig = {
  windowMs: 1000, // 1 second window
  max: 3, // Allow 3 requests per window
  message: 'Too many requests, please try again later.', // Custom message for 429 response
  // The express-rate-limit middleware automatically sets the 429 status code
  // and the 'Retry-After' header by default when the limit is exceeded.
};

// Create an instance of the rate limit middleware with our test configuration.
const limiter = rateLimit(testRateLimitConfig);

// --- Mock Issue Creation Handler ---
// This is a simplified Express request handler that simulates the behavior of
// the actual route handler for POST /issues when a request is *not* rate-limited.
// It should return a 201 status code for a valid request body.
const mockIssueCreationHandler = (req: Request, res: Response) => {
  // Simulate basic validation for a POST request body.
  if (!req.body || typeof req.body.title !== 'string' || typeof req.body.description !== 'string') {
    // If validation fails, return a 400 error (this runs before rate limit if placed before it,
    // but after if placed after. Here it's after, so it only runs on non-rate-limited requests).
    return res.status(400).send({ message: 'Title and description are required' });
  }
  // Simulate a successful issue creation response with a 201 status.
  res.status(201).send({ id: 'mock-issue-id-12345', title: req.body.title, description: req.body.description });
};

// --- Create a test Express application ---
// We set up a minimal Express app to isolate the route and rate limiting logic for testing.
const app: Express = express();
// Add middleware to parse JSON request bodies. Necessary for POST requests.
app.use(express.json());

// Define the route: Apply the rate limiter middleware *before* the actual handler
// for POST requests on the specified path.
app.post(ISSUE_PATH, limiter, mockIssueCreationHandler);

// --- Test Suite for POST /issues Rate Limiting ---
describe('POST /issues Rate Limiting', () => {
  // Helper function to create a standard request using supertest.
  const makeIssueRequest = () => {
    // Provide a valid request body according to the mock handler's expectation.
    return request(app)
      .post(ISSUE_PATH)
      .send({ title: 'Test Issue Title', description: 'Test Issue Description for rate limit test.' });
  };

  // Test Case 1: Verify that requests within the configured rate limit are successful.
  it(`should allow up to ${testRateLimitConfig.max} requests within the window and return 201 status`, async () => {
    const limit = testRateLimitConfig.max;
    // Make requests up to the maximum allowed limit.
    for (let i = 0; i < limit; i++) {
      const response = await makeIssueRequest();
      // Expect each of these requests to be successful (HTTP status 201 Created).
      expect(response.status).toBe(201);
      // Optionally, check the response body structure from the mock handler.
      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe('Test Issue Title');
    }
  });

  // Test Case 2: Verify that exceeding the rate limit results in a 429 status code.
  it('should return 429 status code when the rate limit is exceeded', async () => {
    const limit = testRateLimitConfig.max;

    // First, exhaust the rate limit by making the maximum allowed number of requests.
    // Awaiting each request ensures they complete and count towards the limit.
    for (let i = 0; i < limit; i++) {
      await makeIssueRequest();
    }

    // Now, make one additional request. This request should exceed the limit.
    const response = await makeIssueRequest();

    // Expect a 429 Too Many Requests status code from the rate limiter.
    expect(response.status).toBe(429);
    // Optionally, check the specific message returned by the rate limiter.
    expect(response.body).toHaveProperty('message');
    expect(response.body.message).toBe(testRateLimitConfig.message);
  });

  // Test Case 3: Verify that the Retry-After header is present in the response
  // when the rate limit is exceeded.
  it('should include a Retry-After header in the response when the rate limit is exceeded', async () => {
    const limit = testRateLimitConfig.max;

    // First, exhaust the rate limit by making the maximum allowed requests.
    for (let i = 0; i < limit; i++) {
      await makeIssueRequest();
    }

    // Make the request that exceeds the limit.
    const response = await makeIssueRequest();

    // Ensure the status is 429 before checking for the header.
    expect(response.status).toBe(429);

    // Check for the presence of the 'retry-after' header.
    // Supertest normalizes header names to lowercase.
    expect(response.headers).toHaveProperty('retry-after');

    // Verify the value of the Retry-After header.
    const retryAfterValue = response.headers['retry-after'];

    // The express-rate-limit middleware typically sends a delta-seconds value (a number of seconds)
    // as a string for the Retry-After header, according to RFC 6585.
    // Parse the string value to an integer.
    const retryAfterSeconds = parseInt(retryAfterValue, 10);

    // Expect the parsed value to be a valid number and positive.
    expect(isNaN(retryAfterSeconds)).toBe(false); // Ensure the string was parsed into a number.
    expect(retryAfterSeconds).toBeGreaterThan(0); // Ensure the suggested wait time is positive.
  });

  // Cleanup: After all tests in this describe block have finished,
  // add a short delay to ensure the rate limit window has fully passed.
  // This helps prevent interference between tests if the test runner
  // reuses resources or runs other test files immediately after this one.
  afterAll(async () => {
    // Wait slightly longer than the configured rate limit window duration.
    await new Promise((resolve) => setTimeout(resolve, testRateLimitConfig.windowMs + 200)); // Add a small buffer
  });
});
