import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from '../db/entities/attachment.entity';
import { Issue } from '../db/entities/issue.entity';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class AttachmentService {
  constructor(
    @InjectRepository(Issue)
    private issueRepository: Repository<Issue>,
    @InjectRepository(Attachment)
    private attachmentRepository: Repository<Attachment>,
  ) {}

  async create(issueKey: string, files: Express.Multer.File[]): Promise<Attachment[]> {
    const issue = await this.issueRepository.findOne({ where: { issueKey } });

    if (!issue) {
      throw new NotFoundException(`Issue with key ${issueKey} not found`);
    }

    const attachments: Attachment[] = [];

    for (const file of files) {
      try {
        const storedFilename = uuidv4();
        const uploadPath = './uploads'; // Define the upload directory
        const destPath = path.join(uploadPath, storedFilename);

        // Ensure the upload directory exists
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath);
        }

        fs.renameSync(file.path, destPath); // Synchronous operation for simplicity

        const attachment = this.attachmentRepository.create({
          issueId: issue.id,
          filename: file.originalname,
          storedFilename,
          mimetype: file.mimetype,
          size: file.size,
          authorId: null, // As per the requirements
        });

        const savedAttachment = await this.attachmentRepository.save(attachment);
        attachments.push(savedAttachment);

      } catch (error) {
        // Add more specific error handling as needed.
        console.error(`Error processing file ${file.originalname}:`, error);
        // Consider re-throwing or handling the error appropriately.  For example, you might want to rollback the transaction
        // if multiple files are being uploaded and one fails. For now, we just log and continue with other files.
      }
    }

    return attachments;
  }
}
