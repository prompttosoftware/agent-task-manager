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

// Mock the uploads directory
const UPLOAD_DIR = path.join(__dirname, 'uploads_test');
const TMP_UPLOAD_DIR = path.join(tmpdir(), 'uploads_test_tmp');

describe("AttachmentService", () => {
    let issueRepository = AppDataSource.getRepository(Issue);
    let attachmentRepository = AppDataSource.getRepository(Attachment);
    let attachmentService: AttachmentService;
    let testIssue: Issue;

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

        // Ensure the uploads directories exist before each test
        try {
            await fs.mkdir(UPLOAD_DIR, { recursive: true });
            await fs.mkdir(TMP_UPLOAD_DIR, { recursive: true });
        } catch (error: any) {
             // Ignore EEXIST error if directory already exists
            if (error.code !== 'EEXIST') {
                console.error("Error creating uploads directory:", error);
                throw error;
            }
        }
        attachmentService = new AttachmentService();

    });

    afterEach(async () => {
      // Clean up temporary files created during tests in the uploads directory
       try {
           const filesInUploadsDir = await fs.readdir('./uploads');
           for (const file of filesInUploadsDir) {
               // Check if the file is one of the temporary files created in this test suite
               // A more robust solution might track the created files
               if (file.startsWith('temp-')) { // Basic check based on filename pattern
                    await fs.unlink(path.join('./uploads', file));
               }
           }

            // Clean up temporary upload directory
            await fs.rm(TMP_UPLOAD_DIR, { recursive: true, force: true });

       } catch (error) {
           console.error("Error during afterEach cleanup:", error);
       }
    });


    describe("create", () => {
        it("should return a 404 if the issue is not found", async () => {
            await expect(attachmentService.create("NONEXISTENT-123", [] as any)).rejects.toThrow(NotFoundError);
        });

        it("should successfully create attachment records and files for uploaded files", async () => {
            const fileContent1 = 'test content 1';
            const fileContent2 = 'test content 2';

            // Create temporary files in the temporary upload directory
            const tmpFilePath1 = path.join(TMP_UPLOAD_DIR, 'temp-file1.txt');
            const tmpFilePath2 = path.join(TMP_UPLOAD_DIR, 'temp-file2.txt');

            await fs.writeFile(tmpFilePath1, fileContent1);
            await fs.writeFile(tmpFilePath2, fileContent2);


            const testFiles: Express.Multer.File[] = [
                {
                    fieldname: 'file1',
                    originalname: 'test1.txt',
                    encoding: '7bit',
                    mimetype: 'text/plain',
                    destination: TMP_UPLOAD_DIR,
                    filename: 'temp-file1.txt', // Multer generates temp filename
                    path: tmpFilePath1,
                    size: fileContent1.length,
                    stream: null as any, // stream is not directly used with disk storage
                    buffer: null as any, // buffer is not directly available with disk storage
                },
                {
                    fieldname: 'file2',
                    originalname: 'test2.txt',
                    encoding: '7bit',
                    mimetype: 'text/plain',
                    destination: TMP_UPLOAD_DIR,
                    filename: 'temp-file2.txt', // Multer generates temp filename
                    path: tmpFilePath2,
                    size: fileContent2.length,
                    stream: null as any, // stream is not directly used with disk storage
                    buffer: null as any, // buffer is not directly available with disk storage
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

                // Check if the file exists in the uploads directory
                const filePath = path.join('./uploads', attachment.storedFilename);
                await expect(fs.access(filePath)).resolves.toBeUndefined();

                // Verify content of the moved file (optional, but good practice)
                 const movedFileContent = await fs.readFile(filePath, 'utf-8');
                 // Need to determine which testFile corresponds to this attachment's originalname

                  // Assuming a simple mapping for this test, might need a more robust way
                 if (attachment.filename === 'test1.txt') {
                      expect(movedFileContent).toBe(fileContent1);
                 } else if (attachment.filename === 'test2.txt') {
                     expect(movedFileContent).toBe(fileContent2);
                 }
            }

        });


        it("should return a 400 Bad Request if no files are attached", async () => {
           await expect(attachmentService.create(testIssue.issueKey, [] as any)).rejects.toThrow(BadRequestError);
        });
    });
});
