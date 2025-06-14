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

    async getAttachmentsByIssueKey(issueKey: string): Promise<Attachment[]> {
        const attachments = await this.attachmentRepository.find({
            where: { issue: { issueKey: issueKey } },
        });
        return attachments;
    }

    async deleteAttachment(attachmentId: number): Promise<void> {
        const attachment = await this.attachmentRepository.findOneBy({ id: attachmentId });

        if (!attachment) {
            throw new NotFoundError(`Attachment with ID ${attachmentId} not found`);
        }

        try {
          // Delete the file from the filesystem
          const filePath = path.join('uploads', attachment.storedFilename);
          if (await fs.access(filePath).then(() => true).catch(() => false)) {
            await fs.unlink(filePath);
          } else {
            console.warn(`File not found: ${filePath}`);
          }
          
          // Delete the attachment record from the database
          await this.attachmentRepository.remove(attachment);

        } catch (err: any) {
          console.error(`Error deleting attachment ${attachmentId}:`, err);
          throw new Error(`Failed to delete attachment ${attachmentId}: ${err.message}`);
        }
    }

    async getAttachmentById(attachmentId: number): Promise<Attachment | null> {
      const attachment = await this.attachmentRepository.findOneBy({ id: attachmentId });
      return attachment;
    }
}

export const attachmentService = new AttachmentService();
console.log("attachmentService instance created");
