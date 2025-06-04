/**
 * Controller function to handle the creation of an issue.
 * Validates input, logs the data, and returns a success or error response.
 *
 * @param req - The Express request object.
 * @param res - The Express response object.
 */
export const createIssue = (req: any, res: any): void => {
  console.log('Request body:', req.body);
  const issueData = req.body;

  // Basic validation: Check for required fields as per swagger schema example
  // In a real application, use a dedicated validation library (e.g., Joi, Express-validator)
  if (!issueData || !issueData.fields) {
    return res.status(400).send({ message: 'Invalid request body: missing fields object.' });
  }

  const fields = issueData.fields;
  if (!fields.project || !fields.project.key) {
    return res.status(400).send({ message: 'Invalid request body: missing project key.' });
  }
  if (!fields.summary) {
    return res.status(400).send({ message: 'Invalid request body: missing summary.' });
  }
  if (!fields.issuetype || !fields.issuetype.name) {
    return res.status(400).send({ message: 'Invalid request body: missing issue type name.' });
  }

  // Validate parent issue key if provided
  if (fields.parent) {
    if (typeof fields.parent !== 'object' || fields.parent === null) {
      return res.status(400).send({ message: 'Invalid request body: parent field must be an object if provided.' });
    }
    if (!fields.parent.key || typeof fields.parent.key !== 'string' || fields.parent.key.trim() === '') {
      return res.status(400).send({ message: 'Invalid request body: parent key is required if parent field is provided.' });
    }
  }

  // Log the validated issue data
  console.log('Received issue data:', JSON.stringify(issueData, null, 2));

  // Placeholder for actual issue creation logic (database interaction, etc.)
  // For this iteration, we just log and return success.

  // Return success response
  res.status(201).send({ message: 'Issue created successfully (logged)' });
};

// Although not requested, other potential controller functions might include:
// export const getIssue = (req: any, res: any): void => { /* ... */ };
// export const updateIssue = (req: any, res: any): void => { /* ... */ };
// export const deleteIssue = (req: any, res: any): void => { /* ... */ };
// export const listIssues = (req: any, res: any): void => { /* ... */ };
