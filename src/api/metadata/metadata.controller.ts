// src/api/metadata/metadata.controller.ts

import { Request, Response } from 'express';
import { MetadataService } from './metadata.service';
import { IssueService } from '../../services/issue.service';

export class MetadataController {
  private metadataService: MetadataService;
  private issueService: IssueService;

  constructor(metadataService: MetadataService, issueService: IssueService) {
    this.metadataService = metadataService;
    this.issueService = issueService;
  }

  public getCreateMeta = async (req: Request, res: Response) => {
    try {
      const metadata = await this.metadataService.getCreateMeta();
      return res.status(200).json(metadata);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Failed to retrieve create metadata' });
    }
  };
}
