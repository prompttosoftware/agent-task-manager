// src/api/controllers/createIssue.ts
import { Request, Response } from 'express';
import { createIssue as issueServiceCreateIssue, getIssueByKey } from '../../issueService';
import { CreateIssueInput, AnyIssue } from '../../models';
import { IssueCreationError, IssueErrorCodes } from '../../utils/errorHandling';
import logger from '../../utils/logger';


interface IncomingCreateIssueRequestBody {
  fields: {
    summary: string;
    description?: string;
    issuetype: {
      name: string;
    };
    parent?: {
      key: string;
    };
    [key: string]: any;
  };
  [key: string]: any;
}

// Regex for validating the parent key format (e.g., PROJ-123)
const ISSUE_KEY_REGEX = /^[A-Z]+-[0-9]+$/;

export const createIssue = async (req: Request<{}, {}, IncomingCreateIssueRequestBody>, res: Response) => {
  logger.info('createIssue Controller: Start processing request.');
  try {
    logger.info('createIssue Controller: Received body:', { body: req.body });

    // Validate the essential structure of the incoming request body
    if (!req.body || !req.body.fields) {
        // Re-adding log before throw to match test expectation
        logger.error('IssueCreationError during validation: Invalid request body format.', { error: IssueErrorCodes.INVALID_INPUT, statusCode: 400 });
        throw new IssueCreationError("Invalid request body format.", IssueErrorCodes.INVALID_INPUT, 400);
    }

    const { fields } = req.body;

    if (!fields.summary || typeof fields.summary !== 'string') {
        // Re-adding log before throw to match test expectation
        logger.error('IssueCreationError during validation: Missing or invalid summary.', { error: IssueErrorCodes.MISSING_TITLE, statusCode: 400 });
         throw new IssueCreationError("Missing or invalid 'summary' in request fields.", IssueErrorCodes.MISSING_TITLE, 400);
    }

     if (!fields.issuetype || typeof fields.issuetype.name !== 'string') {
        // Re-adding log before throw to match test expectation
         logger.error('IssueCreationError during validation: Missing or invalid issuetype name.', { error: IssueErrorCodes.INVALID_ISSUE_TYPE, statusCode: 400 });
          throw new IssueCreationError("Missing or invalid 'issuetype' name in request fields.", IssueErrorCodes.INVALID_ISSUE_TYPE, 400);
     }

    // Add validation: Epic and Bug cannot have parents
    if ((fields.issuetype.name === 'Epic' || fields.issuetype.name === 'Bug') && fields.parent?.key) {
        // Re-adding log before throw to match test expectation
        logger.error('IssueCreationError during validation: Epic/Bug cannot have a parent.', { error: IssueErrorCodes.INVALID_PARENT_KEY, issueType: fields.issuetype.name, parentKey: fields.parent.key, statusCode: 400 });
        throw new IssueCreationError("Epic and Bug issue types cannot have a parent issue.", IssueErrorCodes.INVALID_PARENT_KEY, 400);
    }

    // Validate parent key structure and existence if provided
    if (fields.parent?.key) {
      const parentKey = fields.parent.key;
      logger.info('createIssue Controller: Validating parent key:', { parentKey: parentKey });

      // *** Add parent key format validation ***
      if (!ISSUE_KEY_REGEX.test(parentKey)) {
          // Re-adding log before throw to match test expectation
           logger.error('IssueCreationError during validation: Invalid parent key format.', { error: IssueErrorCodes.INVALID_INPUT, parentKey: parentKey, statusCode: 400 });
          throw new IssueCreationError(`Parent issue key "${parentKey}" is invalid. Must be in format PROJECT-123.`, IssueErrorCodes.INVALID_INPUT, 400);
      }

      // Check if parent issue exists
      const parentIssue = await getIssueByKey(parentKey);
      if (!parentIssue) {
        // Re-adding log before throw to match test expectation
         logger.error('IssueCreationError during validation: Parent issue not found.', { error: IssueErrorCodes.PARENT_ISSUE_NOT_FOUND, parentKey: parentKey, statusCode: 404 });
        throw new IssueCreationError(`Parent issue with key '${parentKey}' not found.`, IssueErrorCodes.PARENT_ISSUE_NOT_FOUND, 404);
      }
      logger.info('createIssue Controller: Parent key validation successful.');

      // --- Additional Validation for Subtask and Parent Issue Type ---
      if (fields.issuetype.name === 'Subtask' && parentIssue.issueType !== 'Task' && parentIssue.issueType !== 'Story') {
        // Re-adding log before throw to match test expectation
        logger.error('IssueCreationError during validation: Invalid parent type for Subtask.', { error: IssueErrorCodes.INVALID_PARENT_TYPE, issueType: fields.issuetype.name, parentKey: parentKey, parentType: parentIssue.issueType, statusCode: 400 });
        throw new IssueCreationError(`Parent issue with key '${parentKey}' must be of type 'Task' or 'Story' for a Subtask.`, IssueErrorCodes.INVALID_PARENT_TYPE, 400);
      }
      if ((fields.issuetype.name === 'Task' || fields.issuetype.name === 'Story') && parentIssue.issueType !== 'Epic') {
        // Re-adding log before throw to match test expectation
        logger.error('IssueCreationError during validation: Invalid parent type for Task/Story.', { error: IssueErrorCodes.INVALID_PARENT_TYPE, issueType: fields.issuetype.name, parentKey: parentKey, parentType: parentIssue.issueType, statusCode: 400 });
        throw new IssueCreationError(`Parent issue with key '${parentKey}' must be of type 'Epic' for a Task or Story.`, IssueErrorCodes.INVALID_PARENT_TYPE, 400);
      }
      // --- End Additional Validation ---
    }

    const serviceInput: CreateIssueInput = {
      title: fields.summary,
      issueTypeName: fields.issuetype.name,
      description: fields.description,
      parentKey: fields.parent?.key,
    };

    logger.info('createIssue Controller: Input passed to service:', { input: serviceInput });

    const createdIssue: AnyIssue = await issueServiceCreateIssue(serviceInput);

    logger.info('createIssue Controller: Service call successful.');

    const responseBody = {
        id: createdIssue.id,
        key: createdIssue.key,
        issueType: {
            name: createdIssue.issueType as string,
        },
        summary: createdIssue.summary,
        description: createdIssue.description,
        status: {
             name: createdIssue.status as string
        },
        createdAt: createdIssue.createdAt,
        updatedAt: createdIssue.updatedAt,
        self: `/rest/api/2/issue/${createdIssue.key}`
    };

    logger.info('createIssue Controller: Constructed Response Body:', { response: responseBody });

    logger.info('createIssue Controller: Successfully created issue.', { issueKey: createdIssue.key });

    res.status(201).json(responseBody);

  } catch (error: any) {
    if (error instanceof IssueCreationError) {
      logger.error("Caught IssueCreationError:", { error: error.message, code: error.errorCode, status: error.statusCode });

      // Include specific field errors if applicable, particularly for INVALID_INPUT related to parent key format
      const errors: { [key: string]: string } = {};
      if (error.errorCode === IssueErrorCodes.INVALID_INPUT && error.message.includes('Parent issue key')) {
          errors.parentKey = error.message;
      }
      // Add other specific field error mappings here if needed

      res.status(error.statusCode || 400).json({
        errorMessages: [error.message],
        errors: errors, // Use the potentially populated errors object
       });
    }
    else {
      logger.error("Unexpected error in createIssue controller:", error);
      res.status(500).json({
        errorMessages: ['An unexpected error occurred.'],
        errors: {},
       });
    }
  }
};
