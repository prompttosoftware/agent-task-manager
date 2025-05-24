import { Request, Response } from 'express';
import { AnyIssue, loadDatabase, saveDatabase } from '../models';
import { v4 as uuidv4 } from 'uuid';

export const createIssue = async (req: Request, res: Response) => {
    try {
        const { issueType, summary, description, status } = req.body;

        // Basic validation
        if (!issueType || !summary || !status) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const db = await loadDatabase();
        const newIssue: AnyIssue = {
            id: uuidv4(),
            key: `ATM-${db.issueKeyCounter + 1}`,
            issueType,
            summary,
            description,
            status,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        db.issues.push(newIssue);
        db.issueKeyCounter++;
        await saveDatabase(db);

        res.status(201).json(newIssue);
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Failed to create issue' });
    }
};
