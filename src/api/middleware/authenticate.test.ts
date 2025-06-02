import { Request, Response, NextFunction } from 'express';
import { authenticate } from './authenticate';
import { Buffer } from 'buffer';

// Mock Request, Response, and NextFunction
const mockRequest = () => {
  const req: Partial<Request> = {};
  req.headers = {};
  return req as Request;
};

const mockResponse = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnThis(); // Allow chaining .json()
  res.json = jest.fn();
  return res as Response;
};

const mockNext = jest.fn() as NextFunction;

describe('Authentication Middleware', () => {
  let req: Request;
  let res: Response;
  let originalEnv: NodeJS.ProcessEnv;

  const TEST_USERNAME = 'testuser';
  const TEST_PASSWORD = 'testpassword';
  const VALID_AUTH_HEADER = 'Basic ' + Buffer.from(`${TEST_USERNAME}:${TEST_PASSWORD}`).toString('base64');
  const INVALID_USER_AUTH_HEADER = 'Basic ' + Buffer.from(`wronguser:${TEST_PASSWORD}`).toString('base64');
  const INVALID_PASS_AUTH_HEADER = 'Basic ' + Buffer.from(`${TEST_USERNAME}:wrongpassword`).toString('base64');

  beforeEach(() => {
    // Save original env and create a mutable copy for the test
    originalEnv = process.env;
    process.env = { ...originalEnv };

    // Reset mocks before each test
    req = mockRequest();
    res = mockResponse();
    (mockNext as jest.Mock).mockClear();

    // Set expected credentials in the mocked environment
    process.env.AUTH_USERNAME = TEST_USERNAME;
    process.env.AUTH_PASSWORD = TEST_PASSWORD;
  });

  afterEach(() => {
    // Restore original env after each test
    process.env = originalEnv;
  });

  // 1. Successful authentication
  test('should call next() when authentication is successful', () => {
    req.headers.authorization = VALID_AUTH_HEADER;

    authenticate(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  // 2. Authentication failure (invalid credentials)
  test('should return 401 and error message for incorrect password', () => {
    req.headers.authorization = INVALID_PASS_AUTH_HEADER;

    authenticate(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ errorMessages: ["Authentication failed."] });
  });

  test('should return 401 and error message for incorrect username', () => {
    req.headers.authorization = INVALID_USER_AUTH_HEADER;

    authenticate(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ errorMessages: ["Authentication failed."] });
  });

  // Additional tests covering other failure cases handled by the middleware
  test('should return 401 and error message when authorization header is missing', () => {
    // No authorization header set on req.headers
    authenticate(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ errorMessages: ["Authorization header missing."] });
  });

  test('should return 401 and error message when authorization header is not in Basic format', () => {
    req.headers.authorization = 'Bearer some-token';

    authenticate(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ errorMessages: ["Authentication failed."] });
  });

  test('should return 401 and error message when base64 credentials are invalid', () => {
    req.headers.authorization = 'Basic invalid-base64!'; // Contains invalid characters

    authenticate(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ errorMessages: ["Authentication failed."] });
  });

  test('should return 401 and error message when decoded credentials are not in username:password format', () => {
    req.headers.authorization = 'Basic ' + Buffer.from('justusername').toString('base64'); // Missing colon and password

    authenticate(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ errorMessages: ["Authentication failed."] });
  });

  test('should return 401 and error message when environment variables are not set', () => {
    delete process.env.AUTH_USERNAME;
    delete process.env.AUTH_PASSWORD;
    req.headers.authorization = VALID_AUTH_HEADER;

    // Spy on console.error to check if it's called (optional but good practice)
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    authenticate(req, res, mockNext);

    expect(mockNext).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ errorMessages: ["Authentication failed."] });
    expect(consoleErrorSpy).toHaveBeenCalledWith("Server misconfiguration: AUTH_USERNAME or AUTH_PASSWORD environment variable not set.");

    consoleErrorSpy.mockRestore(); // Restore the original console.error
  });
});
