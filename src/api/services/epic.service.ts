import { Epic, EpicCreateRequest, EpicUpdateRequest } from '../types/epic.d';
import db from '../../src/db/database';
import { Logger } from '../../src/utils/logger';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

const logger = new Logger('EpicService');

// DTOs for validation
class EpicCreateDto implements EpicCreateRequest {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsString()
  @IsNotEmpty()
  name: string;
}

class EpicUpdateDto implements EpicUpdateRequest {
  @IsString()
  @IsOptional()
  key?: string;

  @IsString()
  @IsOptional()
  name?: string;
}

export class EpicService {
  async getEpicByKey(epicKey: string): Promise<Epic | undefined> {
    try {
      const select = db.prepare('SELECT key, name, created_at FROM epics WHERE key = ?');
      const epic = select.get(epicKey) as Epic | undefined;
      return epic;
    } catch (error: any) {
      logger.error('Error getting epic by key:', error);
      throw new Error(error.message || 'Failed to get epic by key');
    }
  }

  async getAllEpics(): Promise<Epic[]> {
    try {
      const select = db.prepare('SELECT key, name, created_at FROM epics');
      const epics = select.all() as Epic[];
      return epics;
    } catch (error: any) {
      logger.error('Error getting all epics:', error);
      throw new Error(error.message || 'Failed to get all epics');
    }
  }

  async createEpic(epicData: EpicCreateRequest): Promise<Epic> {
    try {
      const epicDto = plainToClass(EpicCreateDto, epicData);
      const errors: ValidationError[] = await validate(epicDto);

      if (errors.length > 0) {
        const errorMessages = errors.map((err) => Object.values(err.constraints)).flat();
        logger.error(`Validation failed: ${errorMessages.join(', ')}`);
        throw new Error(`Validation failed: ${errorMessages.join(', ')}`);
      }

      const insert = db.prepare('INSERT INTO epics (key, name, created_at) VALUES (?, ?, ?) returning key;');
      const now = new Date().toISOString();
      const info = insert.run(epicDto.key, epicDto.name, now);
      const epicKey: string = info.lastInsertRowid as any; // Correctly get the key
      const newEpic: Epic = {
        key: epicDto.key,
        name: epicDto.name,
        createdAt: now,
      };
      return newEpic;
    } catch (error: any) {
      logger.error('Error creating epic:', error);
      throw new Error(error.message || 'Failed to create epic');
    }
  }

  async updateEpic(epicKey: string, epicData: EpicUpdateRequest): Promise<Epic | undefined> {
    try {
      const epicDto = plainToClass(EpicUpdateDto, epicData);
      const errors: ValidationError[] = await validate(epicDto);

      if (errors.length > 0) {
        const errorMessages = errors.map((err) => Object.values(err.constraints)).flat();
        logger.error(`Validation failed: ${errorMessages.join(', ')}`);
        throw new Error(`Validation failed: ${errorMessages.join(', ')}`);
      }

      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (epicDto.key !== undefined) {
        updateFields.push('key = ?');
        updateValues.push(epicDto.key);
      }
      if (epicDto.name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(epicDto.name);
      }

      if (updateFields.length === 0) {
          const existingEpic = await this.getEpicByKey(epicKey);
          if (!existingEpic) {
              throw new Error(`Epic with key ${epicKey} not found`);
          }
          return existingEpic;
      }

      const updateQuery = `UPDATE epics SET ${updateFields.join(', ')} WHERE key = ?`;
      const update = db.prepare(updateQuery);
      updateValues.push(epicKey);
      const result = update.run(...updateValues);

      if (result.changes === 0) {
          const existingEpic = await this.getEpicByKey(epicKey);
          if (!existingEpic) {
              throw new Error(`Epic with key ${epicKey} not found`);
          }
          return existingEpic;
      }

      const updatedEpic = await this.getEpicByKey(epicKey);
      if (!updatedEpic) {
          throw new Error(`Epic with key ${epicKey} not found after update`);
      }

      return updatedEpic;
    } catch (error: any) {
      logger.error('Error updating epic:', error);
      throw new Error(error.message || 'Failed to update epic');
    }
  }

  async deleteEpic(epicKey: string): Promise<void> {
    try {
      const deleteStatement = db.prepare('DELETE FROM epics WHERE key = ?');
      const result = deleteStatement.run(epicKey);
      if (result.changes === 0) {
        throw new Error(`Epic with key ${epicKey} not found`);
      }
    } catch (error: any) {
      logger.error('Error deleting epic:', error);
      throw new Error(error.message || 'Failed to delete epic');
    }
  }

  async getIssuesByEpicKey(epicKey: string): Promise<any[]> {
    // Assuming you have a way to link issues to epics
    try {
      const select = db.prepare(
        `SELECT i.id, i.summary, i.description, i.status, i.created_at, i.updated_at
         FROM issues i
         JOIN epic_issues ei ON i.id = ei.issue_id
         JOIN epics e ON ei.epic_key = e.key
         WHERE e.key = ?`
      );
      const issues = select.all(epicKey);
      return issues;
    } catch (error: any) {
      logger.error('Error getting issues by epic key:', error);
      throw new Error(error.message || 'Failed to get issues by epic key');
    }
  }
}