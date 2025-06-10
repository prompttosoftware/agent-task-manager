import request from 'supertest';
import express, { Application, Request, Response, NextFunction } from 'express';
import issueRoutes from '../src/routes/issue.routes';
import { IssueService } from '../src/services/issue.service';
import { AttachmentService } from '../src/services/attachment.service';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';

// Mock the service layer
jest.mock('../src/services/issue.service');
jest.mock('../src/services/attachment.service'); // Mock AttachmentService

const mockCreateIssue = jest.fn();
const mockGetIssue = jest.fn();
const mockDeleteIssue = jest.fn();
const mockAddAttachment = jest.fn();
const mockCreate = jest.fn();
const mockGetAttachments = jest.fn();

(IssueService as jest.Mock).mockImplementation(() => {
  return {
    createIssue: mockCreateIssue,
    getIssue: mockGetIssue,
    deleteIssue: mockDeleteIssue,
    addAttachment: mockAddAttachment,
  };
});

(AttachmentService as jest.Mock).mockImplementation(() => {
  return {
    create: mockCreate,
    getAttachments: mockGetAttachments
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

// We need a temporary directory for uploads that the test can control
const tempUploadsDir = path.join(__dirname, 'temp_uploads');

// Mock multer configuration
jest.mock('../src/middleware/upload.config', () => {
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, tempUploadsDir);
    },
    filename: (req, file, cb) => {
      cb(null, uuidv4() + path.extname(file.originalname));
    },
  });

  return {
    __esModule: true,
    default: multer({
      storage: storage,
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  };
});

describe('Issue Attachment Routes', () => {

  beforeAll(() => {
    // Create a temporary upload directory for tests
    if (!fs.existsSync(tempUploadsDir)) {
      fs.mkdirSync(tempUploadsDir);
    }
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
      if (fs.existsSync(tempUploadsDir)) {
          fs.readdirSync(tempUploadsDir).forEach(f => fs.unlinkSync(path.join(tempUploadsDir, f)));
      }
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

describe('AttachmentService Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should return 404 if issue not found', async () => {
        const issueKey = 'NON-EXISTENT-ISSUE';
        mockGetIssue.mockResolvedValue(null); // Simulate issue not found

        await request(app)
            .post(`/rest/api/2/issue/${issueKey}/attachments`)
            .attach('file', Buffer.from('test content'), 'test.txt')
            .expect(404);

        expect(mockGetIssue).toHaveBeenCalledWith(issueKey);
    });

    it('should create a file in the uploads directory', async () => {
        const issueKey = 'TEST-ISSUE';
        const fileContent = Buffer.from('test file content');
        const filename = 'test.txt';
        let storedFilename : string;

        // Mock the AttachmentService.create method
        mockCreate.mockImplementation(async (issueId: number, files: any) => {
            // Simulate successful file upload
            storedFilename = uuidv4() + path.extname(files[0].originalname);
            return [{
                issueId: issueId,
                filename: files[0].originalname,
                storedFilename: storedFilename,
                mimetype: files[0].mimetype,
                size: files[0].size,
            }];
        });
        mockGetIssue.mockResolvedValue({id: 1, key: issueKey})

        await request(app)
            .post(`/rest/api/2/issue/${issueKey}/attachments`)
            .attach('file', fileContent, filename)
            .expect(200)
            .expect(res => {
                expect(res.body).toBeInstanceOf(Array);
                expect(res.body.length).toBe(1);
                expect(res.body[0].filename).toBe(filename);
            });
         // Verify that the file exists in the uploads directory
        const uploadFilePath = path.join(tempUploadsDir, storedFilename!);
        expect(fs.existsSync(uploadFilePath)).toBe(true);
    });

    it('should return attachment metadata on successful upload', async () => {
        const issueKey = 'ATTACH-TEST';
        const fileContent = Buffer.from('test content');
        const filename = 'test.txt';
        const mockAttachmentData = [{
            issueId: 1,
            filename: filename,
            storedFilename: uuidv4() + path.extname(filename),
            mimetype: 'text/plain',
            size: fileContent.length,
        }];

        // Mock the AttachmentService.create method to return mock data.
        mockCreate.mockResolvedValue(mockAttachmentData);
        mockGetIssue.mockResolvedValue({id: 1, key: issueKey});

        const response = await request(app)
            .post(`/rest/api/2/issue/${issueKey}/attachments`)
            .attach('file', fileContent, filename)
            .expect(200);

        expect(response.body).toEqual(mockAttachmentData); // Verify the response matches the mock data.
        expect(mockCreate).toHaveBeenCalled();
    });
});
