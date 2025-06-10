import request from 'supertest';
import express, { Application, Request, Response, NextFunction } from 'express';
import issueRoutes from '../src/routes/issue.routes';
import { IssueService } from '../src/services/issue.service';
import path from 'path';
import fs from 'fs';

// Mock the service layer
jest.mock('../src/services/issue.service');

const mockCreateIssue = jest.fn();
const mockGetIssue = jest.fn();
const mockDeleteIssue = jest.fn();
const mockAddAttachment = jest.fn(); // This will be a service method later

(IssueService as jest.Mock).mockImplementation(() => {
  return {
    createIssue: mockCreateIssue,
    getIssue: mockGetIssue,
    deleteIssue: mockDeleteIssue,
    addAttachment: mockAddAttachment,
  };
});

const app: Application = express();
app.use(express.json());
// Use the actual routes, which will instantiate a controller with a mocked service
app.use('/rest/api/2', issueRoutes);

// Custom error handler to catch multer errors for consistent testing
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof Error) {
    // Specifically catch Multer's "LIMIT_FILE_SIZE" error
    if ((err as any).code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large' });
    }
    return res.status(500).json({ error: 'An unexpected error occurred.', message: err.message });
  }
  next(err);
});


describe('Issue Attachment Routes', () => {
  // We need a temporary directory for uploads that the test can control
  const tempUploadsDir = path.join(__dirname, 'temp_uploads');

  beforeAll(() => {
    // Create a temporary upload directory for tests
    if (!fs.existsSync(tempUploadsDir)) {
      fs.mkdirSync(tempUploadsDir);
    }
    // Temporarily modify the upload configuration to use this directory
    // This is a bit of a workaround because the multer config is hardcoded.
    // In a real app, the upload path might come from an env variable.
    jest.mock('../src/middleware/upload.config', () => {
      const multer = require('multer');
      return {
        __esModule: true,
        default: multer({
          dest: tempUploadsDir,
          limits: {
            fileSize: 10 * 1024 * 1024, // 10MB
          },
        }),
      };
    });
  });

  afterAll(() => {
    // Clean up the temporary directory
    fs.rmSync(tempUploadsDir, { recursive: true, force: true });
    jest.unmock('../src/middleware/upload.config');
  });

  beforeEach(() => {
      // Clear mocks and reset any temporary file system state if necessary
      jest.clearAllMocks();
      // Clean the temp directory before each test
      fs.readdirSync(tempUploadsDir).forEach(f => fs.unlinkSync(path.join(tempUploadsDir, f)));
  });

  it('should return 413 Payload Too Large for a file exceeding 10MB', async () => {
    const issueKey = 'TEST-1';
    // Create a buffer that is slightly larger than 10MB
    const oversizedBuffer = Buffer.alloc(10 * 1024 * 1024 + 1, 'a');

    await request(app)
      .post(`/rest/api/2/issue/${issueKey}/attachments`)
      .attach('file', oversizedBuffer, 'oversized-file.txt')
      .expect(413);
  });

  it('should pass the request to the controller for a valid file', async () => {
    const issueKey = 'TEST-2';
    const validBuffer = Buffer.from('This is a valid file.');

    // Mock the controller's behavior for this specific test
    mockAddAttachment.mockResolvedValue({ message: 'Files uploaded successfully' });

    const response = await request(app)
      .post(`/rest/api/2/issue/${issueKey}/attachments`)
      .attach('file', validBuffer, 'valid-file.txt')
      .expect(200);
    
    expect(response.body.message).toEqual('Files uploaded successfully');
    // Verify that the controller's logic (which calls the service) was invoked
    expect(mockAddAttachment).toHaveBeenCalled();
  });

  it('should return 400 if no files are uploaded', async () => {
    const issueKey = 'TEST-3';
    await request(app)
      .post(`/rest/api/2/issue/${issueKey}/attachments`)
      .expect(400)
      .then(response => {
         expect(response.body.error).toEqual('No files were uploaded.');
      });
  });
});

describe('Other Issue Routes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should call createIssue when POST /rest/api/2/issue is called', async () => {
        mockCreateIssue.mockResolvedValue({ id: 1, summary: 'Test issue' });
        await request(app).post('/rest/api/2/issue').send({ summary: 'Test issue' }).expect(200);
        expect(mockCreateIssue).toHaveBeenCalled();
    });

    it('should call getIssue when GET /rest/api/2/issue/:issueKey is called', async () => {
        const issueKey = 'TEST-123';
        mockGetIssue.mockResolvedValue({ id: 1, key: issueKey });
        await request(app).get(`/rest/api/2/issue/${issueKey}`).expect(200);
        expect(mockGetIssue).toHaveBeenCalledWith(issueKey);
    });

    it('should call deleteIssue when DELETE /rest/api/2/issue/:issueKey is called', async () => {
        const issueKey = 'TEST-123';
        mockDeleteIssue.mockResolvedValue(undefined);
        await request(app).delete(`/rest/api/2/issue/${issueKey}`).expect(204);
        expect(mockDeleteIssue).toHaveBeenCalledWith(issueKey);
    });
});
