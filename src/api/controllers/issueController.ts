import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createIssue as createIssueService } from '../../services/issueService'; // Correct import path

// Define allowed issue types
const ALLOWED_ISSUE_TYPES = ['Bug', 'Task', 'Story'];

// Regex for Jira-like parent key format (e.g., PROJECT-123)
const PARENT_KEY_REGEX = /^[A-Z]+-[0-9]+$/;

/**
 * Handles the creation of a new issue.
 *
 * @param req - The Express request object.
 * @param res - The Express response object.
 */
export const createIssue = async (req: Request, res: Response): Promise<void> => {
  console.log('createIssue controller started.');
  // Parse request body
  const { fields, parent } = req.body;

  // 1. Validate request body structure and required fields
  if (!fields) {
    res.status(400).json({ message: 'Missing required field: "fields".' });
    return;
  }

  const summary = fields.summary;
  const description = fields.description; // Description is optional
  const issueType = fields.issuetype?.name;
  const projectKey = fields.project?.key; // Assuming project key is required in fields

  if (!summary || typeof summary !== 'string' || summary.trim().length === 0) {
    res.status(400).json({ message: 'Invalid or missing field: "fields.summary". It must be a non-empty string.' });
    return;
  }

  if (!issueType || typeof issueType !== 'string' || issueType.trim().length === 0) {
    res.status(400).json({ message: 'Invalid or missing field: "fields.issuetype.name". It must be a non-empty string.' });
    return;
  }

  if (!ALLOWED_ISSUE_TYPES.includes(issueType)) {
    res.status(400).json({ message: `Invalid value for "fields.issuetype.name". Allowed values are: ${ALLOWED_ISSUE_TYPES.join(', ')}.` });
    return;
  }

  if (!projectKey || typeof projectKey !== 'string' || projectKey.trim().length === 0) {
     res.status(400).json({ message: 'Invalid or missing field: "fields.project.key". It must be a non-empty string.' });
     return;
  }


  // 2. Validate parent if provided
  if (parent) {
    if (!parent.key || typeof parent.key !== 'string' || parent.key.trim().length === 0) {
      res.status(400).json({ message: 'Invalid or missing field: "parent.key". It must be a non-empty string if "parent" is provided.' });
      return;
    }
    if (!PARENT_KEY_REGEX.test(parent.key)) {
      res.status(400).json({ message: `Invalid format for "parent.key": "${parent.key}". Expected format like "PROJECT-123".` });
      return;
    }

    // Optional: Validate if the project key in fields matches the parent key prefix
    const parentProjectPrefix = parent.key.split('-')[0];
    if (projectKey !== parentProjectPrefix) {
         res.status(400).json({ message: `Project key "${projectKey}" must match the project prefix of the parent key "${parent.key}". Expected "${parentProjectPrefix}".` });
         return;
    }
  }

  // Log the parsed and validated data (for demonstration)
  console.log('Received issue data:');
  console.log('Summary:', summary);
  console.log('Description:', description); // Can be undefined
  console.log('Project Key:', projectKey);
  console.log('Issue Type:', issueType);
  console.log('Parent Key:', parent?.key); // Can be undefined

  try {
    // Generate a UUID for the new issue
    const id = uuidv4();

    // Prepare data for the service layer
    const issueData = {
      id,
      summary,
      description: description || '', // Ensure description is a string for the service
      project: projectKey, // Use the validated project key
      issueType,
      // Note: The service currently doesn't handle 'parent'.
      // If subtask functionality were needed, the service signature or logic
      // would need to be updated to accept and process the parent information.
      // Add parentKey conditionally if parent is provided in the request body
      ...(parent && { parentKey: parent.key }),
    };

    // Call the service to create the issue
    // Assuming the service can handle the structure derived from the new body format
    const createdIssue = await createIssueService(issueData);

    // Return a 201 status with the created issue data
    // In a real Jira API, this would often return key, self link, etc.
    // For now, returning the created issue data as the service does.
    console.log('Issue created successfully, sending response.');
    res.status(201).json(createdIssue);

  } catch (error) {
    // Handle potential errors during service call or creation
    console.error('Error creating issue:', error);
    res.status(500).json({ message: 'Failed to create issue', error: (error as Error).message });
  }
};
