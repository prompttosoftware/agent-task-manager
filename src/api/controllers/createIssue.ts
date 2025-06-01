// src/api/controllers/createIssue.ts
import { Request, Response } from 'express';
import { createIssue as issueServiceCreateIssue } from '../../issueService';
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


export const createIssue = async (req: Request<{}, {}, IncomingCreateIssueRequestBody>, res: Response) => {
  logger.info('createIssue Controller: Start processing request.');
  try {
    logger.info('createIssue Controller: Received body:', { body: req.body });

    // Validate the essential structure of the incoming request body
    if (!req.body || !req.body.fields) {
        logger.error("IssueCreationError during validation: Invalid request body format.", { error: IssueErrorCodes.INVALID_INPUT, statusCode: 400, body: req.body });
        throw new IssueCreationError("Invalid request body format.", IssueErrorCodes.INVALID_INPUT, 400);
    }

    const { fields } = req.body;

    if (!fields.summary || typeof fields.summary !== 'string') {
        logger.error("IssueCreationError during validation: Missing or invalid 'summary'.", { error: IssueErrorCodes.MISSING_TITLE, statusCode: 400, body: req.body });
         throw new IssueCreationError("Missing or invalid 'summary' in request fields.", IssueErrorCodes.MISSING_TITLE, 400);
    }

     if (!fields.issuetype || typeof fields.issuetype.name !== 'string') {
        logger.error("IssueCreationError during validation: Missing or invalid 'issuetype' name.", { error: IssueErrorCodes.INVALID_ISSUE_TYPE, statusCode: 400, body: req.body });
          throw new IssueCreationError("Missing or invalid 'issuetype' name in request fields.", IssueErrorCodes.INVALID_ISSUE_TYPE, 400);
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
      res.status(error.statusCode || 400).json({
        errorMessages: [error.message],
        errors: {},
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
