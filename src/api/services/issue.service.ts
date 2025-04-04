// src/api/services/issue.service.ts
import { Issue, IssueCreateRequest, IssueUpdateRequest } from '../types/issue.d';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { Logger } from '../../src/utils/logger';
import db from '../../src/db/database';
import { IsString, IsNotEmpty, IsOptional, IsIn, IsNumber } from 'class-validator';

const logger = new Logger('IssueService');

const validStatuses = ['open', 'in progress', 'resolved', 'closed'];

/**
 * Data transfer object for creating an issue.
 */
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

/**
 * Data transfer object for updating an issue.
 */
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

/**
 * Creates a new issue in the database.
 *
 * @param issueData - The data for the new issue.
 * @returns A promise that resolves with the created issue.
 * @throws Error if validation fails or if there's a database error.
 */
export const createIssue = async (issueData: any): Promise<Issue> => {
  try {
    const issueDto = plainToClass(IssueCreateDto, issueData);
    const errors: ValidationError[] = await validate(issueDto);

    if (errors.length > 0) {
      const errorMessages = errors.map((err) => Object.values(err.constraints)).flat();
      logger.error(`Validation failed: ${errorMessages.join(', ')}`);
      const error = new Error(`Validation failed: ${errorMessages.join(', ')}`);
      (error as any).status = 400; // Bad Request
      throw error;
    }

    const insert = db.prepare(
      `INSERT INTO issues (summary, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?) returning id;`
    );
    const now = new Date().toISOString();
    const info = insert.run(
      issueDto.summary,
      issueDto.description || '',
      issueDto.status,
      now,
      now
    );
    const issueId: number = info.lastInsertRowid as number;
    const newIssue: Issue = {
      id: issueId,
      summary: issueDto.summary,
      description: issueDto.description,
      status: issueDto.status,
      createdAt: now,
      updatedAt: now,
    } as Issue;
    return newIssue;
  } catch (error: any) {
    logger.error('Error creating issue:', error);
    const err = new Error(error.message || 'Failed to create issue');
    (err as any).status = error.status || 500; // Internal Server Error or original status
    throw err;
  }
};

/**
 * Updates an existing issue in the database.
 *
 * @param id - The ID of the issue to update.
 * @param issueData - The data to update the issue with.
 * @returns A promise that resolves with the updated issue.
 * @throws Error if validation fails, the issue is not found, or if there's a database error.
 */
export const updateIssue = async (id: number, issueData: any): Promise<Issue> => {
  try {
    const issueDto = plainToClass(IssueUpdateDto, issueData);
    const errors: ValidationError[] = await validate(issueDto);

    if (errors.length > 0) {
      const errorMessages = errors.map((err) => Object.values(err.constraints)).flat();
      logger.error(`Validation failed: ${errorMessages.join(', ')}`);
      const error = new Error(`Validation failed: ${errorMessages.join(', ')}`);
      (error as any).status = 400; // Bad Request
      throw error;
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    if (issueDto.summary !== undefined) {
      updateFields.push('summary = ?');
      updateValues.push(issueDto.summary);
    }
    if (issueDto.description !== undefined) {
      updateFields.push('description = ?');
      updateValues.push(issueDto.description);
    }
    if (issueDto.status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(issueDto.status);
    }

    if (updateFields.length === 0) {
      // Nothing to update, return the existing issue.
      const existingIssue = await getIssueById(id);
      if (!existingIssue) {
        const error = new Error(`Issue with ID ${id} not found`);
        (error as any).status = 404; // Not Found
        throw error;
      }
      return existingIssue;
    }

    const updateQuery = `UPDATE issues SET ${updateFields.join(', ')}, updated_at = ? WHERE id = ?`;
    const update = db.prepare(updateQuery);
    const now = new Date().toISOString();
    updateValues.push(now, id);

    const result = update.run(...updateValues);

    if (result.changes === 0) {
      // If no rows were changed, the issue might not exist.
      const existingIssue = await getIssueById(id);
      if (!existingIssue) {
        const error = new Error(`Issue with ID ${id} not found`);
        (error as any).status = 404; // Not Found
        throw error;
      }
      return existingIssue;
    }

    const updatedIssue = await getIssueById(id);
    if (!updatedIssue) {
      const error = new Error(`Issue with ID ${id} not found after update`);
      (error as any).status = 404; // Not Found
      throw error;
    }
    return updatedIssue;

  } catch (error: any) {
    logger.error('Error updating issue:', error);
    const err = new Error(error.message || 'Failed to update issue');
    (err as any).status = error.status || 500; // Internal Server Error or original status
    throw err;
  }
};

/**
 * Retrieves an issue from the database by its ID.
 *
 * @param id - The ID of the issue to retrieve.
 * @returns A promise that resolves with the issue, or undefined if not found.
 * @throws Error if there's a database error.
 */
export const getIssueById = async (id: number): Promise<Issue | undefined> => {
  try {
    const select = db.prepare('SELECT id, summary, description, status, created_at, updated_at FROM issues WHERE id = ?');
    const issue = select.get(id) as Issue | undefined;
    return issue;
  } catch (error: any) {
    logger.error('Error getting issue by id:', error);
    throw new Error(error.message || 'Failed to get issue by ID');
  }
};
