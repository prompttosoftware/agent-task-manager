import { Request, Response, NextFunction } from 'express';

/**
 * Creates a new issue.
 * @param req - The request object.
 * @param res - The response object.
 * @param next - The next function.
 */
export const createIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Implement issue creation logic here (e.g., save to database)
    console.log('Creating a new issue:', req.body);

    // Simulate successful issue creation
    const newIssue = {
      id: '123', // Generate a unique ID, typically from database
      ...req.body,
    };

    res.status(201).json(newIssue); // 201 Created
  } catch (error) {
    console.error('Error creating issue:', error);
    next(error); // Pass the error to the error handler middleware
  }
};

/**
 * Retrieves an issue by its ID.
 * @param req - The request object.
 * @param res - The response object.
 * @param next - The next function.
 */
export const getIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const issueId = req.params.id;
    console.log('Getting issue with ID:', issueId);

    // Implement issue retrieval logic here (e.g., fetch from database)
    // Simulate finding an issue
    const issue = {
      id: issueId,
      title: 'Sample Issue',
      description: 'This is a sample issue description.',
    };

    if (issue) {
      res.status(200).json(issue); // 200 OK
    } else {
      res.status(404).json({ message: 'Issue not found' }); // 404 Not Found
    }
  } catch (error) {
    console.error('Error getting issue:', error);
    next(error); // Pass the error to the error handler middleware
  }
};

/**
 * Deletes an issue by its ID.
 * @param req - The request object.
 * @param res - The response object.
 * @param next - The next function.
 */
export const deleteIssue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const issueId = req.params.id;
    console.log('Deleting issue with ID:', issueId);

    // Implement issue deletion logic here (e.g., delete from database)
    // Simulate successful deletion
    // In a real application, you'd likely check if the deletion was successful
    // before sending the 204 response.
    res.status(204).send(); // 204 No Content - Successful deletion, no content to send back
  } catch (error) {
    console.error('Error deleting issue:', error);
    next(error); // Pass the error to the error handler middleware
  }
};
