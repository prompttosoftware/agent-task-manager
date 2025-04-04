// src/api/services/issue.service.ts
import { Issue, IssueCreateRequest, IssueUpdateRequest } from '../types/issue.d';
import { validate, ValidationError } from 'class-validator';
import { plainToClass, classToPlain } from 'class-transformer';
import { Logger } from '../../src/utils/logger';
import { db } from '../../src/db/database';
import { IsString, IsNotEmpty, IsOptional, IsIn, IsNumber } from 'class-validator';

const logger = new Logger('IssueService');

const validStatuses = ['open', 'in progress', 'resolved', 'closed'];

class IssueCreateDto implements IssueCreateRequest {
  @IsString()
  @IsNotEmpty()
  summary: string;

  @IsString()
  description: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(validStatuses)
  status: string;
}

class IssueUpdateDto implements IssueUpdateRequest {
  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @IsIn(validStatuses)
  status?: string;
}

export const createIssue = async (issueData: any): Promise<Issue> => {
    try {
      const issueDto = plainToClass(IssueCreateDto, issueData);
      const errors: ValidationError[] = await validate(issueDto);
      if (errors.length > 0) {
        const errorMessages = errors.map(err => Object.values(err.constraints)).flat();
        logger.error(`Validation failed: ${errorMessages.join(', ')}`);
        throw new Error(`Validation failed: ${errorMessages.join(', ')}`);
      }

      const newIssue: Issue = {
        ...issueDto,
        id: Math.floor(Math.random() * 1000000), // Generate a realistic ID
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      // Implement issue creation logic here, e.g., database interaction.
      // For now, just return the issue data with a generated ID.
      return newIssue;
    } catch (error: any) {
        logger.error('Error creating issue:', error);
        throw new Error(error.message || 'Failed to create issue');
    }
};

export const updateIssue = async (id: number, issueData: any): Promise<Issue> => {
  try {
    const issueDto = plainToClass(IssueUpdateDto, issueData);
    const errors: ValidationError[] = await validate(issueDto);

    if (errors.length > 0) {
      const errorMessages = errors.map((err) =>
        Object.values(err.constraints)
      ).flat();
      logger.error(`Validation failed: ${errorMessages.join(', ')}`);
      throw new Error(`Validation failed: ${errorMessages.join(', ')}`);
    }

    // Fetch the existing issue.  This is a placeholder.  Replace with actual DB call
    let existingIssue: Issue | undefined = await getIssueById(id); // Replace with actual DB fetch

    if (!existingIssue) {
      throw new Error(`Issue with ID ${id} not found`);
    }

    // Apply updates.  Important:  Only update if a value was provided.
    if (issueDto.summary !== undefined) {
      existingIssue.summary = issueDto.summary;
    }
    if (issueDto.description !== undefined) {
      existingIssue.description = issueDto.description;
    }
    if (issueDto.status !== undefined) {
      existingIssue.status = issueDto.status;
    }

    existingIssue.updatedAt = new Date().toISOString();

    // Save the updated issue.  Placeholder - replace with database save.
    // await saveIssue(existingIssue);
    // Return the updated issue.
    return existingIssue;
  } catch (error: any) {
    logger.error('Error updating issue:', error);
    throw new Error(error.message || 'Failed to update issue');
  }
};

export const getIssueById = async (id: number): Promise<Issue | undefined> => {
    // Placeholder. Replace with actual database call.
    // Simulate fetching an issue from a database.  For demonstration, just return a dummy
    const issue: Issue | undefined =  {
        id: id,
        summary: `Issue ${id} Summary`,
        description: `Description for issue ${id}`,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    // Simulate a "not found" condition
    if (id > 5) {
        return undefined;
    }
    return issue;
};