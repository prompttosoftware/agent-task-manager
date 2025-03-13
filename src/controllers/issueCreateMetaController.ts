// src/controllers/issueCreateMetaController.ts
import { Request, Response } from 'express';
import { getIssueCreateMetadata } from '../services/issueCreateMetaService';

export async function getIssueCreateMeta(req: Request, res: Response) {
  try {
    const { projectKeys, issueTypeNames } = req.query;

    const metadata = await getIssueCreateMetadata(
      Array.isArray(projectKeys) ? projectKeys : projectKeys ? [projectKeys] : undefined,
      Array.isArray(issueTypeNames) ? issueTypeNames : issueTypeNames ? [issueTypeNames] : undefined
    );

    res.status(200).json(metadata);
  } catch (error: any) {
    if (error.message === 'Invalid projectKeys or issueTypeNames') {
      res.status(400).json({ error: error.message });
    } else {
      console.error(error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}
