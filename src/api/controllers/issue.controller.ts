// src/api/controllers/issue.controller.ts

import { Request, Response } from 'express';
import * as issueService from '../services/issue.service'; // Import the issue service
import { Issue } from '../../types/issue';
import { IssueLink } from '../../types/issue'; // Import IssueLink type

// Create a new issue
export const createIssue = async (req: Request, res: Response) => {
  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    // Call the service to create the issue
    const newIssue: Issue = {
      id: String(Date.now()), // Temporary ID generation.  Use a proper UUID in production.
      description,
    };
    // const createdIssue = await issueService.createIssue(newIssue);
    // Instead of creating a new ID here, we pass in the issue and the service layer can create it.
    const createdIssue = await issueService.createIssue(newIssue);

    res.status(201).json(createdIssue); // 201 Created
  } catch (error: any) {
    console.error('Error creating issue:', error);
    res.status(500).json({ error: `Failed to create issue. ${error.message}` }); // 500 Internal Server Error
  }
};

// Get all issues
export const getAllIssues = async (req: Request, res: Response) => {
  try {
    const allIssues = await issueService.getAllIssues();
    res.status(200).json(allIssues);
  } catch (error: any) {
    console.error('Error getting all issues:', error);
    res.status(500).json({ error: `Failed to get issues. ${error.message}` }); // 500 Internal Server Error
  }
};

// Get a specific issue by ID
export const getIssueById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const issue = await issueService.getIssueById(id);

    if (!issue) {
      return res.status(404).json({ error: 'Issue not found' }); // 404 Not Found
    }

    res.status(200).json(issue);
  } catch (error: any) {
    console.error('Error getting issue by ID:', error);
    res.status(500).json({ error: `Failed to get issue. ${error.message}` }); // 500 Internal Server Error
  }
};

// Update an existing issue
export const updateIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description is required' }); // 400 Bad Request
    }

    const updatedIssue: Issue = {
      id, // Keep the original ID
      description,
    };

    const result = await issueService.updateIssue(updatedIssue);

    if (!result) {
      return res.status(404).json({ error: 'Issue not found' }); // 404 Not Found
    }

    res.status(200).json(result); // 200 OK
  } catch (error: any) {
    console.error('Error updating issue:', error);
    res.status(500).json({ error: `Failed to update issue. ${error.message}` }); // 500 Internal Server Error
  }
};

// Delete an issue
export const deleteIssue = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await issueService.deleteIssue(id);

    res.status(204).send(); // 204 No Content (successful deletion)
  } catch (error: any) {
    console.error('Error deleting issue:', error);
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: `Issue not found.` });
    }
    res.status(500).json({ error: `Failed to delete issue. ${error.message}` }); // 500 Internal Server Error
  }
};

// Create an issue link
export const createIssueLink = async (req: Request, res: Response) => {
  try {
    const issueLink: IssueLink = req.body; // Assuming the request body contains the IssueLink data

    await issueService.createIssueLink(issueLink);
    res.status(201).send(); // 201 Created
  } catch (error: any) {
    console.error('Error creating issue link:', error);
    res.status(500).json({ error: `Failed to create issue link. ${error.message}` });
  }
};