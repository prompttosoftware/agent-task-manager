import express from 'express';
import * as issueService from '../../services/issueService.ts';

const router = express.Router();

/**
 * @route POST /issue
 * @description Creates a new issue.
 * @param {object} req.body - The request body.
 * @param {string} req.body.summary - The summary of the issue.
 * @param {string} [req.body.description] - The description of the issue.
 * @returns {object} 201 - The newly created issue object.
 * @returns {object} 400 - Bad request error message.
 * @returns {object} 500 - Internal server error message.
 */
router.post('/issue', async (req, res) => {
  const { summary, description } = req.body;

  if (!summary || typeof summary !== 'string') {
    return res.status(400).json({ error: 'Summary is required and must be a string' });
  }

  try {
    const issue = await issueService.createIssue({ summary, description });
    res.status(201).json(issue);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create issue' });
  }
});

export const issueRoutes = router;
