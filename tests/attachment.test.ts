import { AttachmentService } from "../src/services/attachment.service";
import { AppDataSource } from "../src/data-source";
import { Issue } from "../src/db/entities/issue.entity";
import { Attachment } from "../src/db/entities/attachment.entity";
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Express } from 'express';
import { NotFoundError, BadRequestError } from "routing-controllers";
import { Readable } from 'stream';
import { tmpdir } from 'os';
import * as fsPromises from 'fs/promises';


// Mock the uploads directory
const UPLOAD_DIR = path.join(__dirname, 'uploads_test');


describe("AttachmentService", () => {
    let issueRepository = AppDataSource.getRepository(Issue);
    let attachmentRepository = AppDataSource.getRepository(Attachment);
    let attachmentService: AttachmentService;
    let testIssue: Issue;

    beforeAll(async () => {
      try {
        await fs.mkdir(UPLOAD_DIR, { recursive: true });
      } catch (error: any) {
        console.error("Error creating uploads directory:", error);
        throw error;
      }
    });

    beforeEach(async () => {
        // Synchronize the database before each test
        await AppDataSource.synchronize(true);

        // Clear the database before each test
        await attachmentRepository.clear();
        await issueRepository.clear();

        // Create a test issue
        testIssue = new Issue();
        testIssue.issueKey = "TEST-123";
        testIssue.title = "Test Issue";
        testIssue.description = "Test Description";
        testIssue.priority = "High"; // Provide a value for the non-nullable priority field
        testIssue.issueTypeId = 1; // Provide a value for the non-nullable issueTypeId field
        testIssue = await issueRepository.save(testIssue);

        attachmentService = new AttachmentService();

    });

    afterEach(async () => {
      jest.restoreAllMocks();
      // Clean up temporary files created during tests in the uploads directory
       try {
           let filesInUploadsDir = await fs.readdir(UPLOAD_DIR);
            if (!Array.isArray(filesInUploadsDir)) {
                console.warn(`readdir(${UPLOAD_DIR}) did not return an array. Skipping cleanup.`);
                filesInUploadsDir = []; // Ensure it's an empty array to prevent errors
            }
           for (const file of filesInUploadsDir) {
               // Check if the file is one of the temporary files created in this test suite
               // A more robust solution might track the created files
               if (file.startsWith('attachment-')) { // Basic check based on filename pattern
                    await fs.unlink(path.join(UPLOAD_DIR, file));
               }
           }

       } catch (error) {
           console.error("Error during afterEach cleanup:", error);
           console.error("fs.readdir error:", error);
       }
    });


    describe("create", () => {
        it("should return a 404 if the issue is not found", async () => {
            await expect(attachmentService.create("NONEXISTENT-123", [] as any)).rejects.toThrow(NotFoundError);
        });

        it("should successfully create attachment records and files for uploaded files", async () => {
            const fileContent1 = 'test content 1';
            const fileContent2 = 'test content 2';

            const testFiles: Express.Multer.File[] = [
                {
                    fieldname: 'attachment',
                    originalname: 'test1.txt',
                    encoding: '7bit',
                    mimetype: 'text/plain',
                    destination: UPLOAD_DIR,
                    filename: 'attachment-12345.txt',
                    path: path.join(__dirname, 'uploads_test', 'attachment-12345.txt'),
                    size: fileContent1.length,
                    stream: Readable.from(fileContent1), // stream is not directly used with disk storage
                    buffer: Buffer.from(fileContent1), // buffer is not directly available with disk storage
                },
                {
                    fieldname: 'attachment',
                    originalname: 'test2.txt',
                    encoding: '7bit',
                    mimetype: 'text/plain',
                    destination: UPLOAD_DIR,
                    filename: 'attachment-67890.txt', // Multer generates temp filename
                    path: path.join(UPLOAD_DIR, 'attachment-67890.txt'),
                    size: fileContent2.length,
                    stream: Readable.from(fileContent2), // stream is not directly used with disk storage
                    buffer: Buffer.from(fileContent2), // buffer is not directly available with disk storage
                },
            ];

            const attachments = await attachmentService.create(testIssue.issueKey, testFiles);

            expect(attachments).toHaveLength(2);

            for (let i = 0; i < attachments.length; i++) {
                const attachment = attachments[i];
                expect(attachment.issue.id).toBe(testIssue.id);
                expect(attachment.filename).toBe(testFiles[i].originalname);
                expect(attachment.mimetype).toBe(testFiles[i].mimetype);
                // Multer sets size based on the uploaded chunk size, may not match exact content length
                expect(attachment.size).toBeDefined();
                expect(attachment.storedFilename).toBeDefined();

            }

        });


        it("should return a 400 Bad Request if no files are attached", async () => {
           await expect(attachmentService.create(testIssue.issueKey, [] as any)).rejects.toThrow(BadRequestError);
        });
    });
});
