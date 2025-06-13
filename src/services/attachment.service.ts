import { Attachment } from "../db/entities/attachment.entity";
import { Issue } from "../db/entities/issue.entity";
import { AppDataSource } from "../data-source";
import { NotFoundError } from "routing-controllers";
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Multer } from 'multer';

import { BadRequestError } from "routing-controllers";

export class AttachmentService {
    private issueRepository = AppDataSource.getRepository(Issue);
    private attachmentRepository = AppDataSource.getRepository(Attachment);

    constructor() {
        console.log("AttachmentService constructor called");
        this.attachmentRepository = AppDataSource.getRepository(Attachment);
        this.issueRepository = AppDataSource.getRepository(Issue);
    }

    async create(issueKey: string, files: Express.Multer.File[]): Promise<Attachment[]> {
        const issue = await this.issueRepository.findOne({ where: { issueKey } });

        if (!issue) {
            throw new NotFoundError(`Issue with key ${issueKey} not found`);
        }

        if (!files || files.length === 0) {
            throw new BadRequestError("No files attached to the request");
        }


        const attachments: Attachment[] = [];

        for (const file of files) {
            const storedFilename = uuidv4();
            const fileExtension = path.extname(file.originalname);
            const finalFilename = storedFilename + fileExtension;

            const attachment = new Attachment();
            attachment.issue = issue;
            attachment.filename = file.originalname;
            attachment.storedFilename = finalFilename;
            attachment.mimetype = file.mimetype;
            attachment.size = file.size;
            attachment.author = null;

            const savedAttachment = await this.attachmentRepository.save(attachment);
            attachments.push(savedAttachment);
        }

        return attachments;
    }
}

export const attachmentService = new AttachmentService();
console.log("attachmentService instance created");
