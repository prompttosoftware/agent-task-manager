import { Attachment } from "../db/entities/attachment.entity";
import { Issue } from "../db/entities/issue.entity";
import { AppDataSource } from "../data-source";
import { NotFoundError } from "routing-controllers";
import { v4 as uuidv4 } from 'uuid';
import * as fsPromises from 'fs/promises';
import * as fs from 'fs';
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
            console.log(`Processing file: ${file.originalname}`);

            const attachment = new Attachment();
            if (!issue.issueKey) {
                throw new Error("Issue key is null or undefined");
            }

            attachment.issue = issue;
            attachment.filename = file.originalname;
            attachment.storedFilename = file.filename;
            attachment.mimetype = file.mimetype;
            attachment.size = file.size;
            attachment.author = null;

            try {
                const savedAttachment = await this.attachmentRepository.save(attachment);
                console.log("Attachment saved successfully:", savedAttachment);
                attachments.push(savedAttachment);
            } catch (dbError: any) {
                console.error("Error saving attachment to database:", dbError);
                console.error("dbError.message", dbError.message);
                console.error("dbError.stack", dbError.stack);
                throw new Error(`Error saving attachment to database: ${dbError.message}`);
            }
        }

        return attachments;
    }

    async getAttachmentsByIssueKey(issueKey: string): Promise<Attachment[]> {
        const attachments = await this.attachmentRepository.find({
            where: { issue: { issueKey: issueKey } },
            relations: ['issue']
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
          fsPromises.access(filePath)
            .then(() => {
              fsPromises.unlink(filePath);
            })
            .catch(() => {
              console.warn(`File not found: ${filePath}`);
            });
          
          // Delete the attachment record from the database
          await this.attachmentRepository.remove(attachment);

        } catch (err: any) {
          console.error(`Error deleting attachment ${attachmentId}:`, err);
          throw new Error(`Failed to delete attachment ${attachmentId}: ${err.message}`);
        }
    }

    async getAttachmentById(attachmentId: number): Promise<Attachment | null> {
      const attachment = await this.attachmentRepository.findOne({
        where: { id: attachmentId },
        relations: ['issue'],
      });
      return attachment;
    }

  async deleteAttachmentsByIssueKey(issueKey: string): Promise<void> {
    const attachments = await this.getAttachmentsByIssueKey(issueKey);

    for (const attachment of attachments) {
      await this.deleteAttachment(attachment.id);
    }
  }
}

export const attachmentService = new AttachmentService();
console.log("attachmentService instance created");
