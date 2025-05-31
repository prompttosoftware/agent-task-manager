import { Request, Response } from 'express';
import { createIssue as createIssueService } from '../../issueService';
import { IssueCreationError, errorStatusCodeMap, IssueErrorCodes } from '../../utils/errorHandling';

// Define allowed values for issue types and statuses for validation within this controller
const allowedIssueTypes = ["Task", "Story", "Epic", "Bug", "Subtask"];
const allowedStatuses = ["Todo", "In Progress", "Done"];

/**
 * Creates a new issue based on the provided request body by calling the issue service.
 *
 * The request body is expected to contain the following fields:
 * - `issueType` (string, required): The type of the issue. Must be one of "Task", "Story", "Epic", "Bug", "Subtask".
 * - `summary` (string, required): A concise summary of the issue. Cannot be empty.
 * - `status` (string, required): The status of the issue. Must be one of "Todo", "In Progress", "Done".
 * - `description` (string, optional): A detailed description of the issue. Defaults to an empty string if not provided.
 * - `parentIssueKey` (string, optional): The key of the parent issue. Required for Subtasks (must be a non-empty string). Allowed for Task and Story (optional). Not allowed for Epic or Bug.
 *
 * This controller performs basic request body validation (presence of required fields, allowed values for enums, basic parentKey presence/absence rules based on issue type). More complex validation, like checking if a provided parentIssueKey exists or has a valid type, is delegated to the `issueService`.
 *
 * The controller is updated to return validation errors (both from controller-level checks and validation-related errors from the service) in the format:
 * `{"errorMessages": ["message"], "errors": {}}`
 *
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @returns {Promise<void>} - A Promise that resolves when the response has been sent.
 *
 * Responses:
 * - 201 Created: Successfully created the issue. Returns the created issue object in the response body.
 * - 400 Bad Request: If the request body contains invalid data based on controller's basic validation (missing required fields, invalid enum values, incorrect parentKey presence/absence), or if the service returns a validation-related error (like INVALID_INPUT, INVALID_PARENT_TYPE). The response body will contain `{"errorMessages": ["message"], "errors": {}}`.
 * - 404 Not Found: If the service reports a specified parent issue key was not found (`PARENT_ISSUE_NOT_FOUND`). The response body will contain `{"errorMessages": ["message"], "errors": {}}`.
 * - 500 Internal Server Error: An unexpected error occurred on the server side or a service error not specifically mapped or not validation-related. Returns `{ message: 'Internal server error' }` or `{ errorCode: ..., message: ... }` for non-validation IssueCreationErrors.
 */
export const createIssue = async (req: Request, res: Response): Promise<void> => {
  try {
    const { issueType, summary, status, description, parentIssueKey } = req.body;

    // --- Basic Field Validation (Controller's Responsibility) ---
    // Validate required fields
    if (!issueType) {
      res.status(400).json({ errorMessages: ['Missing required field: issueType.'], errors: {} });
      return;
    }
    if (!summary || typeof summary !== 'string' || summary.trim() === '') {
      res.status(400).json({ errorMessages: ['Missing or empty required field: summary.'], errors: {} });
      return;
    }
    if (!status) {
      res.status(400).json({ errorMessages: ['Missing required field: status.'], errors: {} });
      return;
    }

    // Validate issueType value
    if (!allowedIssueTypes.includes(issueType)) {
      res.status(400).json({ errorMessages: [`Invalid value for issueType: "${issueType}". Must be one of: ${allowedIssueTypes.join(', ')}.`], errors: {} });
      return;
    }

    // Validate status value
    if (!allowedStatuses.includes(status)) {
      res.status(400).json({ errorMessages: [`Invalid value for status: "${status}". Must be one of: ${allowedStatuses.join(', ')}.`], errors: {} });
      return;
    }

    // --- Parent Issue Key Validation (Controller's role: basic presence/absence checks) ---
    if (issueType === 'Subtask') {
      if (!parentIssueKey || typeof parentIssueKey !== 'string' || parentIssueKey.trim() === '') {
        res.status(400).json({ errorMessages: ['Missing required field: parentIssueKey is required for Subtasks.'], errors: {} });
        return;
      }
    } else if (issueType === 'Epic' || issueType === 'Bug') {
      if (parentIssueKey !== undefined && parentIssueKey !== null && parentIssueKey !== '') {
           res.status(400).json({ errorMessages: [`Invalid field: parentIssueKey is not allowed for ${issueType} issue types.`], errors: {} });
           return;
      }
    }

    const serviceInput = {
      title: summary,
      issueTypeName: issueType,
      description: description || '',
      parentKey: parentIssueKey && parentIssueKey.trim() !== '' ? parentIssueKey.trim() : null,
    };

    const createdIssueData = await createIssueService(serviceInput);
    res.status(201).json(createdIssueData);

  } catch (error: any) {
    if (error instanceof IssueCreationError) {
      const statusCode = error.statusCode || errorStatusCodeMap[error.errorCode] || 500;

      const isValidationError = [
        IssueErrorCodes.INVALID_INPUT,
        IssueErrorCodes.PARENT_ISSUE_NOT_FOUND,
        IssueErrorCodes.INVALID_PARENT_TYPE,
      ].includes(error.errorCode as IssueErrorCodes);

      if (isValidationError) {
          res.status(statusCode).json({
              errorMessages: [error.message],
              errors: {}
          });
      } else {
          res.status(statusCode).json({
              errorCode: error.errorCode,
              message: error.message
          });
      }
    } else {
      console.error('Error creating issue:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};
