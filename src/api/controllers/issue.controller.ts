// src/api/controllers/issue.controller.ts
import { Request, Response } from 'express';
import { IssueService } from '../services/issue.service';
import { BoardService } from '../services/board.service';
import { Issue } from '../types/issue';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { validationResult } from 'express-validator';
import { addIssueValidator } from '../validators/issue.validator';

// File size limit in bytes (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed file types
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
        cb(null, 'uploads/'); // Specify the upload directory
    },
    filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
        const uniqueSuffix = uuidv4(); // Use UUID for unique filenames
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: (error: Error | null, acceptFile: boolean) => void) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true); // Accept the file
    } else {
        cb(new Error('Invalid file type. Allowed types are: ' + ALLOWED_MIME_TYPES.join(', ')), false); // Reject the file
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: MAX_FILE_SIZE
    },
    fileFilter: fileFilter
});

export class IssueController {
    private issueService: IssueService;
    private boardService: BoardService;

    constructor(issueService: IssueService, boardService: BoardService) {
        this.issueService = issueService;
        this.boardService = boardService;
    }

    /**
     * @description Searches issues based on a query.
     * @param req - The request object.
     * @param res - The response object.
     * @returns {Promise<void>} - Returns a 200 OK with the search results or an error.
     */
    async searchIssues(req: Request, res: Response): Promise<void> {
        try {
            const { query } = req.query;
            if (!query || typeof query !== 'string') {
                res.status(400).json({ error: 'Query parameter is required and must be a string' });
                return;
            }

            const issues = await this.issueService.searchIssues(query);
            res.status(200).json(issues);
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to search issues' });
        }
    }

    /**
     * @description Gets an issue by its key.
     * @param req - The request object.
     * @param res - The response object.
     * @returns {Promise<void>} - Returns a 200 OK with the issue or a 404 if not found.
     */
    async getIssue(req: Request, res: Response): Promise<void> {
        try {
            const { issueKey } = req.params;
            const issue = await this.issueService.getIssue(issueKey);
            if (!issue) {
                res.status(404).json({ error: 'Issue not found' });
                return;
            }
            res.status(200).json(issue);
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to get issue' });
        }
    }

    /**
     * @description Gets issues associated with a specific board.
     * @param req - The request object.
     * @param res - The response object.
     * @returns {Promise<void>} - Returns a 200 OK with the issues or an error.
     */
    async getIssuesByBoard(req: Request, res: Response): Promise<void> {
        try {
            const { boardId } = req.params;
            const issues = await this.issueService.getIssuesByBoard(boardId);
            res.status(200).json(issues);
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to get issues by board' });
        }
    }

    /**
     * @description Adds a new issue.
     * @param req - The request object.
     * @param res - The response object.
     * @returns {Promise<void>} - Returns a 201 Created with the new issue or an error.
     */
    async addIssue(req: Request, res: Response): Promise<void> {
        try {
            await addIssueValidator(req);
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const issueData: Issue = req.body;
            const newIssue = await this.issueService.addIssue(issueData);
            res.status(201).json(newIssue);
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to add issue' });
        }
    }

    /**
     * @description Updates an existing issue.
     * @param req - The request object.
     * @param res - The response object.
     * @returns {Promise<void>} - Returns a 200 OK with the updated issue or a 404 if not found.
     */
    async updateIssue(req: Request, res: Response): Promise<void> {
        try {
            const { issueKey } = req.params;
            const updates: Partial<Issue> = req.body;
            const updatedIssue = await this.issueService.updateIssue(issueKey, updates);
            if (!updatedIssue) {
                res.status(404).json({ error: 'Issue not found' });
                return;
            }
            res.status(200).json(updatedIssue);
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to update issue' });
        }
    }

    /**
     * @description Deletes an issue.
     * @param req - The request object.
     * @param res - The response object.
     * @returns {Promise<void>} - Returns a 204 No Content on success or a 404 if not found.
     */
    async deleteIssue(req: Request, res: Response): Promise<void> {
        try {
            const { issueKey } = req.params;
            const success = await this.issueService.deleteIssue(issueKey);
            if (!success) {
                res.status(404).json({ error: 'Issue not found' });
                return;
            }
            res.status(204).send(); // No content
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to delete issue' });
        }
    }

    /**
     * @description Adds an attachment to an issue.
     * @param req - The request object.
     * @param res - The response object.
     * @returns {Promise<void>} - Returns a 201 Created with the file path or a 404 if the issue is not found.
     */
    addAttachment = async (req: Request, res: Response): Promise<void> => {
        try {
            const { issueKey } = req.params;

            // Multer middleware handles the file upload and validation
            upload.single('attachment')(req, res, async (err: any) => {
                if (err) {
                    // Multer error: file size limit exceeded, invalid file type, etc.
                    console.error('Multer error:', err);
                    if (err instanceof multer.MulterError) {
                        if (err.code === 'LIMIT_FILE_SIZE') {
                            return res.status(413).json({ error: 'File size exceeds the limit of 10MB' });
                        }
                    }
                    return res.status(400).json({ error: err.message }); // Or a more generic error message
                }

                if (!req.file) {
                    return res.status(400).json({ error: 'No file uploaded' });
                }

                const filePath = req.file.path;
                const originalFilename = req.file.originalname;
                const fileSize = req.file.size;
                const mimeType = req.file.mimetype;

                const attachment = await this.issueService.addAttachment(issueKey, filePath, originalFilename, fileSize, mimeType);


                if (!attachment) {
                    return res.status(404).json({ error: 'Issue not found' });
                }

                // Construct the response with attachment metadata
                const response = {
                    message: 'Attachment added successfully',
                    attachment: {
                        filename: originalFilename,
                        filePath: filePath,
                        fileSize: fileSize,
                        mimeType: mimeType,
                        issueKey: issueKey // Include the issue key in the response
                    }
                };
                res.status(201).json(response);
            });
        } catch (error: any) {
            console.error("Error adding attachment:", error);
            res.status(500).json({ error: error.message || 'Failed to add attachment' });
        }
    };

    /**
     * @description Links two issues.
     * @param req - The request object.
     * @param res - The response object.
     * @returns {Promise<void>} - Returns a 200 OK on success or a 400 if the link fails.
     */
    async linkIssue(req: Request, res: Response): Promise<void> {
        try {
            const { fromIssueKey } = req.params;
            const { toIssueKey, type } = req.body;
            const success = await this.issueService.linkIssue(fromIssueKey, toIssueKey, type);
            if (!success) {
                res.status(400).json({ error: 'Failed to link issues' });
                return;
            }
            res.status(200).json({ message: 'Issues linked' });
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to link issue' });
        }
    }

    /**
     * @description Assigns an issue to a user.
     * @param req - The request object.
     * @param res - The response object.
     * @returns {Promise<void>} - Returns a 200 OK with the updated issue or a 404 if not found.
     */
    async assignIssue(req: Request, res: Response): Promise<void> {
        try {
            const { issueKey } = req.params;
            const { assigneeKey } = req.body;
            const updatedIssue = await this.issueService.assignIssue(issueKey, assigneeKey);
            if (!updatedIssue) {
                res.status(404).json({ error: 'Issue not found' });
                return;
            }
            res.status(200).json(updatedIssue);
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to assign issue' });
        }
    }

    /**
     * @description Transitions an issue to a new status.
     * @param req - The request object.
     * @param res - The response object.
     * @returns {Promise<void>} - Returns a 200 OK with the updated issue or a 404 if not found.
     */
    async transitionIssue(req: Request, res: Response): Promise<void> {
        try {
            const { issueKey } = req.params;
            const { transitionId } = req.body;
            const updatedIssue = await this.issueService.transitionIssue(issueKey, transitionId);
            if (!updatedIssue) {
                res.status(404).json({ error: 'Issue not found' });
                return;
            }
            res.status(200).json(updatedIssue);
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to transition issue' });
        }
    }

    /**
     * @description Gets the metadata required to create an issue.
     * @param req - The request object.
     * @param res - The response object.
     * @returns {Promise<void>} - Returns a 200 OK with the create metadata.
     */
    async getCreateMeta(req: Request, res: Response): Promise<void> {
        try {
            const createMeta = await this.issueService.getCreateMeta();
            res.status(200).json(createMeta);
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to get create meta' });
        }
    }

    /**
     * @description Gets the available transitions for an issue.
     * @param req - The request object.
     * @param res - The response object.
     * @returns {Promise<void>} - Returns a 200 OK with the transitions.
     */
    async getTransitions(req: Request, res: Response): Promise<void> {
        try {
            const { issueKey } = req.params;
            const transitions = await this.issueService.getTransitions(issueKey);
            res.status(200).json(transitions);
        } catch (error: any) {
            res.status(500).json({ error: error.message || 'Failed to get transitions' });
        }
    }
}
