// src/api/controllers/issue.controller.ts
import { Request, Response } from 'express';
import { IssueService } from '../services/issue.service';
import { BoardService } from '../services/board.service';
import { validationResult } from 'express-validator';
import multer from 'multer';
import * as path from 'path';
import { Issue } from '../types/issue.d.ts';
import { createIssueValidator, updateIssueValidator } from '../validators/issue.validator';

// Multer configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Store files in the 'uploads' directory
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
});

const fileFilter = (req: any, file: any, cb: any) => {
    const allowedFileTypes = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedFileTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Allowed types are: ' + allowedFileTypes.join(', ')));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
});

export class IssueController {
    private issueService: IssueService;
    private boardService: BoardService;

    constructor(issueService: IssueService, boardService: BoardService) {
        this.issueService = issueService;
        this.boardService = boardService;
    }

    async searchIssues(req: Request, res: Response): Promise<void> {
        try {
            const query = req.query.query as string;
            if (!query) {
                return res.status(400).json({ error: 'Query parameter is required and must be a string' });
            }
            const issues: Issue[] = await this.issueService.searchIssues(query);
            res.status(200).json(issues);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    }

    async getIssue(req: Request, res: Response): Promise<void> {
        try {
            const issueKey = req.params.issueKey;
            const issue: Issue | undefined = await this.issueService.getIssue(issueKey);
            if (!issue) {
                return res.status(404).json({ error: 'Issue not found' });
            }
            res.status(200).json(issue);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    }

    async getIssuesByBoard(req: Request, res: Response): Promise<void> {
        try {
            const boardId = req.params.boardId;
            const issues: Issue[] = await this.issueService.getIssuesByBoard(boardId);
            res.status(200).json(issues);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    }

    async addIssue(req: Request, res: Response): Promise<void> {
        try {
            await Promise.all(createIssueValidator.map(validation => validation.run(req)));
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const issue: Issue = await this.issueService.addIssue(req.body);
            res.status(201).json(issue);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    }

    async updateIssue(req: Request, res: Response): Promise<void> {
        try {
            await Promise.all(updateIssueValidator.map(validation => validation.run(req)));
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }
            const issueKey = req.params.issueKey;
            const updatedIssue: Issue | undefined = await this.issueService.updateIssue(issueKey, req.body);
            if (!updatedIssue) {
                return res.status(404).json({ error: 'Issue not found' });
            }
            res.status(200).json(updatedIssue);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    }

    async deleteIssue(req: Request, res: Response): Promise<void> {
        try {
            const issueKey = req.params.issueKey;
            const deleted = await this.issueService.deleteIssue(issueKey);
            if (!deleted) {
                return res.status(404).json({ error: 'Issue not found' });
            }
            res.status(204).send(); // No content
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    }

    async addAttachment(req: Request, res: Response): Promise<void> {
        upload.single('attachment')(req, res, async (err: any) => {
            if (err) {
                if (err instanceof multer.MulterError) {
                    if (err.code === 'LIMIT_FILE_SIZE') {
                        return res.status(413).json({ error: 'File size exceeds the limit of 10MB' });
                    }
                    return res.status(400).json({ error: err.message });
                }
                return res.status(500).json({ error: 'Failed to upload attachment' });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const issueKey = req.params.issueKey;
            const { originalname, path, size, mimetype } = req.file;

            try {
                const attachment = {
                    filename: originalname,
                    filePath: path,
                    fileSize: size,
                    mimeType: mimetype,
                };

                const updatedIssue: Issue | undefined = await this.issueService.addAttachment(issueKey, attachment);

                if (!updatedIssue) {
                    return res.status(404).json({ error: 'Issue not found' });
                }

                res.status(201).json({
                    message: 'Attachment added successfully',
                    attachment: {
                        filename: originalname,
                        filePath: path,
                        fileSize: size,
                        mimeType: mimetype,
                        issueKey: issueKey,
                    },
                });
            } catch (error: any) {
                console.error(error);
                res.status(500).json({ error: error.message });
            }
        });
    }

    async linkIssue(req: Request, res: Response): Promise<void> {
        try {
            const fromIssueKey = req.params.fromIssueKey;
            const toIssueKey = req.body.toIssueKey;
            const linkType = req.body.linkType;

            await this.issueService.linkIssue(fromIssueKey, toIssueKey, linkType);
            res.status(200).json({ message: 'Issues linked successfully' });
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    }

    async assignIssue(req: Request, res: Response): Promise<void> {
        try {
            const issueKey = req.params.issueKey;
            const assigneeKey = req.body.assigneeKey;
            const updatedIssue: Issue | undefined = await this.issueService.assignIssue(issueKey, assigneeKey);
            if (!updatedIssue) {
                return res.status(404).json({ error: 'Issue not found' });
            }
            res.status(200).json(updatedIssue);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    }

    async transitionIssue(req: Request, res: Response): Promise<void> {
        try {
            const issueKey = req.params.issueKey;
            const transitionId = req.body.transitionId;
            const updatedIssue: Issue | undefined = await this.issueService.transitionIssue(issueKey, transitionId);
            if (!updatedIssue) {
                return res.status(404).json({ error: 'Issue not found' });
            }
            res.status(200).json(updatedIssue);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    }

    async getCreateMeta(req: Request, res: Response): Promise<void> {
        try {
            const createMeta = await this.issueService.getCreateMeta();
            res.status(200).json(createMeta);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    }

    async getTransitions(req: Request, res: Response): Promise<void> {
        try {
            const issueKey = req.params.issueKey;
            const transitions = await this.issueService.getTransitions(issueKey);
            res.status(200).json(transitions);
        } catch (error: any) {
            console.error(error);
            res.status(500).json({ error: error.message });
        }
    }
}