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

    // *** START Input Validation ***

    // Validate basic request body structure and types
    if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) {
      logger.error('IssueCreationError during validation: Invalid request body format (must be an object).', {
        error: IssueErrorCodes.INVALID_INPUT,
        statusCode: 400,
      });
      throw new IssueCreationError(
        'Invalid request body format (must be a JSON object).',
        IssueErrorCodes.INVALID_INPUT,
        400,
      );
    }

    if (
      !('fields' in req.body) ||
      typeof req.body.fields !== 'object' ||
      req.body.fields === null ||
      Array.isArray(req.body.fields)
    ) {
      logger.error('IssueCreationError during validation: Missing or invalid "fields" object.', {
        error: IssueErrorCodes.INVALID_INPUT,
        statusCode: 400,
      });
      throw new IssueCreationError(
        "Missing or invalid 'fields' object in request body.",
        IssueErrorCodes.INVALID_INPUT,
        400,
      );
    }

    const fields = req.body.fields; // Use a non-destructured variable after initial check

    // Validate required fields: summary and issuetype name
    logger.debug('createIssue Controller: Validating summary field.');
    if (!('summary' in fields) || typeof fields.summary !== 'string' || fields.summary.trim().length === 0) {
      logger.error('IssueCreationError during validation: Missing, invalid, or empty summary.', {
        error: IssueErrorCodes.MISSING_TITLE,
        statusCode: 400,
      });
      throw new IssueCreationError(
        "Missing, invalid, or empty 'summary' in request fields.",
        IssueErrorCodes.MISSING_TITLE,
        400,
      );
    }

    logger.debug('createIssue Controller: Validating issuetype object and name field.');
    if (
      !('issuetype' in fields) ||
      typeof fields.issuetype !== 'object' ||
      fields.issuetype === null ||
      Array.isArray(fields.issuetype)
    ) {
      logger.error('IssueCreationError during validation: Missing or invalid "issuetype" object.', {
        error: IssueErrorCodes.INVALID_ISSUE_TYPE,
        statusCode: 400,
      }); // Using INVALID_ISSUE_TYPE for structure error
      throw new IssueCreationError(
        "Missing or invalid 'issuetype' object in request fields.",
        IssueErrorCodes.INVALID_ISSUE_TYPE,
        400,
      );
    }

    if (
      !('name' in fields.issuetype) ||
      typeof fields.issuetype.name !== 'string' ||
      fields.issuetype.name.trim().length === 0
    ) {
      logger.error('IssueCreationError during validation: Missing, invalid, or empty issuetype name.', {
        error: IssueErrorCodes.INVALID_ISSUE_TYPE,
        statusCode: 400,
      });
      throw new IssueCreationError(
        "Missing, invalid, or empty 'issuetype.name' in request fields.",
        IssueErrorCodes.INVALID_ISSUE_TYPE,
        400,
      );
    }

    // Validate optional fields if present: description and parent
    logger.debug('createIssue Controller: Validating optional description field if present.');
    if ('description' in fields && typeof fields.description !== 'string') {
      logger.error('IssueCreationError during validation: Invalid description type (must be string if provided).', {
        error: IssueErrorCodes.INVALID_INPUT,
        statusCode: 400,
      });
      throw new IssueCreationError(
        "Invalid 'description' type in request fields (must be a string if provided).",
        IssueErrorCodes.INVALID_INPUT,
        400,
      );
    }

    logger.debug('createIssue Controller: Validating optional parent field if present.');
    if ('parent' in fields) {
      if (typeof fields.parent !== 'object' || fields.parent === null || Array.isArray(fields.parent)) {
        logger.error('IssueCreationError during validation: Invalid "parent" object.', {
          error: IssueErrorCodes.INVALID_INPUT,
          statusCode: 400,
        });
        throw new IssueCreationError("Invalid 'parent' object in request fields.", IssueErrorCodes.INVALID_INPUT, 400);
      }
      if (!('key' in fields.parent) || typeof fields.parent.key !== 'string' || fields.parent.key.trim().length === 0) {
        logger.error(
          'IssueCreationError during validation: Missing, invalid, or empty parent key within "parent" object.',
          { error: IssueErrorCodes.INVALID_INPUT, statusCode: 400 },
        ); // Using INVALID_INPUT for key structure/presence
        throw new IssueCreationError(
          "Missing, invalid, or empty 'key' within 'parent' object.",
          IssueErrorCodes.INVALID_INPUT,
          400,
        );
      }
      // At this point, if 'parent' is present, 'parent.key' is guaranteed to be a non-empty string.
    }

    // *** END Input Validation ***

    // *** START Input Sanitization ***
    logger.debug('createIssue Controller: Starting input sanitization.');

    // Sanitize summary (required string)
    // Summary is typically plain text, strip all HTML tags and attributes
    const sanitizedSummary = sanitizeHtml(fields.summary, {
      allowedTags: [],
      allowedAttributes: {},
    });
    logger.debug('createIssue Controller: Sanitized summary.');

    // Sanitize description (optional string)
    let sanitizedDescription: string | undefined = undefined;
    if (fields.description !== undefined) {
      // Description is often rich text, allow common formatting tags
      sanitizedDescription = sanitizeHtml(fields.description, {
        allowedTags: sanitizeHtml.defaults.allowedTags,
        allowedAttributes: sanitizeHtml.defaults.allowedAttributes,
      });
      logger.debug('createIssue Controller: Sanitized description.');
    }

    // Sanitize parent.key (optional string if parent object exists and has key)
    let sanitizedParentKey: string | undefined = undefined;
    // Check if parent object exists and key exists and is string (already validated above)
    if (fields.parent?.key) {
      // Parent key should be plain text (like PROJ-123), strip all HTML
      sanitizedParentKey = sanitizeHtml(fields.parent.key, {
        allowedTags: [],
        allowedAttributes: {},
      });
      logger.debug('createIssue Controller: Sanitized parent key.');
    }
    logger.debug('createIssue Controller: Input sanitization complete.');
    // *** END Input Sanitization ***

    // Now, use the *sanitized* values for subsequent logic and service call

    logger.debug('createIssue Controller: Validating Epic/Bug parent restriction using sanitized parent key.');
    // Add validation: Epic and Bug cannot have parents
    // Use sanitizedParentKey for the check
    if ((fields.issuetype.name === 'Epic' || fields.issuetype.name === 'Bug') && sanitizedParentKey) {
      // Re-adding log before throw to match test expectation
      logger.error('IssueCreationError during validation: Epic/Bug cannot have a parent.', {
        error: IssueErrorCodes.INVALID_PARENT_KEY,
        issueType: fields.issuetype.name,
        parentKey: sanitizedParentKey,
        originalParentKey: fields.parent?.key,
        statusCode: 400,
      }); // Log original for debugging
      throw new IssueCreationError(
        'Epic and Bug issue types cannot have a parent issue.',
        IssueErrorCodes.INVALID_PARENT_KEY,
        400,
        { issueType: fields.issuetype.name, parentKey: sanitizedParentKey, originalParentKey: fields.parent?.key },
      ); // Pass details
    } else {
      // Log success if the restriction is not violated
      logger.debug('createIssue Controller: Epic/Bug parent restriction check passed.');
    }

    // Validate parent key structure and existence if provided
    // Use sanitizedParentKey for the check
    if (sanitizedParentKey) {
      const parentKey = sanitizedParentKey; // Use sanitized key for clarity in this block
      logger.info('createIssue Controller: Validating parent key:', { parentKey: parentKey });

      // Add parent key format validation
      logger.info('createIssue Controller: Checking parent key format.', { parentKey: parentKey }); // Added log
      if (!ISSUE_KEY_REGEX.test(parentKey)) {
        // Re-adding log before throw to match test expectation
        logger.error('IssueCreationError during validation: Invalid parent key format.', {
          error: IssueErrorCodes.INVALID_INPUT,
          parentKey: parentKey,
          originalParentKey: fields.parent?.key,
          statusCode: 400,
        }); // Log original for debugging
        throw new IssueCreationError(
          `Parent issue key "${parentKey}" is invalid. Must be in format PROJECT-123.`,
          IssueErrorCodes.INVALID_INPUT,
          400,
          { parentKey: parentKey, originalParentKey: fields.parent?.key },
        ); // Pass details
      }
      logger.info('createIssue Controller: Parent key format is valid.'); // Added log

      // Check if parent issue exists
      logger.info('createIssue Controller: Checking for existence of parent issue.', { parentKey: parentKey }); // Added log
      // getIssueByKey should use the already sanitized/validated key
      const parentIssue = await getIssueByKey(parentKey);
      if (!parentIssue) {
        // Re-adding log before throw to match test expectation
        logger.error('IssueCreationError during validation: Parent issue not found.', {
          error: IssueErrorCodes.PARENT_ISSUE_NOT_FOUND,
          parentKey: parentKey,
          originalParentKey: fields.parent?.key,
          statusCode: 404,
        }); // Log original for debugging
        throw new IssueCreationError(
          `Parent issue with key '${parentKey}' not found.`,
          IssueErrorCodes.PARENT_ISSUE_NOT_FOUND,
          404,
          { parentKey: parentKey, originalParentKey: fields.parent?.key },
        ); // Pass details
      }
      logger.info('createIssue Controller: Parent issue found.'); // Added log

      logger.info('createIssue Controller: Parent key validation successful.');

      // --- Additional Validation for Subtask and Parent Issue Type ---
      // logger.debug('createIssue Controller: Validating parent issue type for Subtask/Task/Story.'); // Removed generic log

      // Validate Subtask parent type
      logger.debug('createIssue Controller: Validating parent issue type for Subtask.');
      if (fields.issuetype.name === 'Subtask') {
        if (parentIssue.issueType !== 'Task' && parentIssue.issueType !== 'Story') {
          logger.error('IssueCreationError during validation: Invalid parent type for Subtask.', {
            error: IssueErrorCodes.INVALID_PARENT_TYPE,
            issueType: fields.issuetype.name,
            parentKey: parentKey,
            parentType: parentIssue.issueType,
            originalParentKey: fields.parent?.key,
            statusCode: 400,
          }); // Log original for debugging
          throw new IssueCreationError(
            `Parent issue with key '${parentKey}' must be of type 'Task' or 'Story' for a Subtask.`,
            IssueErrorCodes.INVALID_PARENT_TYPE,
            400,
            {
              issueType: fields.issuetype.name,
              parentKey: parentKey,
              parentType: parentIssue.issueType,
              originalParentKey: fields.parent?.key,
            },
          ); // Pass details
        }
        logger.debug('createIssue Controller: Subtask parent type is valid.');
      }

      // Validate Task/Story parent type
      logger.debug('createIssue Controller: Validating parent issue type for Task/Story.');
      if (fields.issuetype.name === 'Task' || fields.issuetype.name === 'Story') {
        if (parentIssue.issueType !== 'Epic') {
          logger.error('IssueCreationError during validation: Invalid parent type for Task/Story.', {
            error: IssueErrorCodes.INVALID_PARENT_TYPE,
            issueType: fields.issuetype.name,
            parentKey: parentKey,
            parentType: parentIssue.issueType,
            originalParentKey: fields.parent?.key,
            statusCode: 400,
          }); // Log original for debugging
          throw new IssueCreationError(
            `Parent issue with key '${parentKey}' must be of type 'Epic' for a Task or Story.`,
            IssueErrorCodes.INVALID_PARENT_TYPE,
            400,
            {
              issueType: fields.issuetype.name,
              parentKey: parentKey,
              parentType: parentIssue.issueType,
              originalParentKey: fields.parent?.key,
            },
          ); // Pass details
        }
        logger.debug('createIssue Controller: Task/Story parent type is valid.');
      }
      // --- End Additional Validation ---
    }

    // Construct service input using sanitized values
    const serviceInput: CreateIssueInput = {
      title: sanitizedSummary, // Use sanitized summary
      issueTypeName: fields.issuetype.name, // issuetype.name is validated but not sanitized as it's an enum-like value
      description: sanitizedDescription, // Use sanitized description
      parentKey: sanitizedParentKey, // Use sanitized parent key
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
        name: createdIssue.status as string,
      },
      createdAt: createdIssue.createdAt,
      updatedAt: createdIssue.updatedAt,
      self: `/rest/api/2/issue/${createdIssue.key}`,
    };

    logger.info('createIssue Controller: Constructed Response Body:', { response: responseBody });

    logger.info('createIssue Controller: Successfully created issue.', { issueKey: createdIssue.key });

    res.status(201).json(responseBody);
  } catch (error: any) {
    if (error instanceof IssueCreationError) {
      logger.error('Caught IssueCreationError:', {
        error: error.message,
        code: error.errorCode,
        status: error.statusCode,
        details: error.details,
      }); // Log details

      const errors: { [key: string]: any } = {}; // Use any for detail values
      // Populate errors object based on errorCode and details
      switch (error.errorCode) {
        case IssueErrorCodes.INVALID_INPUT:
          // If details contain parentKey, it's likely the format validation error
          if (error.details?.parentKey) {
            errors.parentKey = error.message; // Use the specific message generated during validation
          }
          // Add other specific INVALID_INPUT checks here if needed
          break;
        case IssueErrorCodes.PARENT_ISSUE_NOT_FOUND:
          if (error.details?.parentKey) {
            errors.parentKey = error.message; // Use the specific message
          }
          break;
        case IssueErrorCodes.INVALID_PARENT_KEY: // Used for Epic/Bug parent restriction
          if (error.details?.issueType && error.details?.parentKey) {
            errors.parent = error.message; // Use the specific message
          }
          break;
        case IssueErrorCodes.INVALID_PARENT_TYPE:
          if (error.details?.issueType && error.details?.parentKey && error.details?.parentType) {
            // Construct a more specific field error message using details if needed,
            // or just use the main message if it's sufficiently detailed.
            // The current error messages generated during the throw are quite detailed.
            errors.parentType = error.message;
          }
          break;
        // Add cases for other error codes if they need specific fields in the 'errors' object
        default:
          // For other errors, the message itself might be sufficient or no specific field error is applicable
          break;
      }

      res.status(error.statusCode || 400).json({
        // The primary error message goes into errorMessages array
        errorMessages: [error.message],
        // Detailed, field-specific errors go into the errors object
        errors: errors, // Use the potentially populated errors object
      });
    } else {
      logger.error('Unexpected error in createIssue controller:', error);
      res.status(500).json({
        errorMessages: ['An unexpected error occurred.'],
        errors: {},
      });
    }
  }
};
