import { Injectable } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { EpicDto } from '../types/epic.d';
import { Logger } from '../../src/utils/logger';
import { db } from '../../src/db/database';

const logger = new Logger('EpicService');

@Injectable()
export class EpicService {

  async getEpicByKey(epicKey: string): Promise<any> {
    try {
      const epic = await db.prepare('SELECT * FROM epics WHERE epic_key = ?').get(epicKey);
      return epic;
    } catch (error: any) {
      logger.error('Error fetching epic:', error);
      throw new Error(error.message || 'Failed to get epic');
    }
  }

  async getAllEpics(): Promise<any[]> {
    try {
      const epics = await db.prepare('SELECT * FROM epics').all();
      return epics;
    } catch (error: any) {
      logger.error('Error fetching all epics:', error);
      throw new Error(error.message || 'Failed to get all epics');
    }
  }

  async createEpic(epicData: any): Promise<any> {
    try {
      // Validate input
      const epicDto = plainToClass(EpicDto, epicData);
      const errors: ValidationError[] = await validate(epicDto);
      if (errors.length > 0) {
        const errorMessages = errors.map(err => Object.values(err.constraints)).flat();
        logger.error(`Validation failed: ${errorMessages.join(', ')}`);
        throw new Error(`Validation failed: ${errorMessages.join(', ')}`);
      }

      const { name, description } = epicData;
      const insert = db.prepare('INSERT INTO epics (epic_key, name, description, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)');
      const epicKey = `EPIC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      const info = insert.run(epicKey, name, description, 'To Do', new Date().toISOString(), new Date().toISOString());
      const createdEpic = { ...epicData, epic_key: epicKey, id: info.lastInsertRowid, created_at: new Date(), updated_at: new Date() };
      return createdEpic;
    } catch (error: any) {
      logger.error('Error creating epic:', error);
      throw new Error(error.message || 'Failed to create epic');
    }
  }

  async updateEpic(epicKey: string, epicData: any): Promise<any> {
    try {
      // Validate input
      const epicDto = plainToClass(EpicDto, epicData);
      const errors: ValidationError[] = await validate(epicDto);
      if (errors.length > 0) {
        const errorMessages = errors.map(err => Object.values(err.constraints)).flat();
        logger.error(`Validation failed: ${errorMessages.join(', ')}`);
        throw new Error(`Validation failed: ${errorMessages.join(', ')}`);
      }
      const { name, description, status } = epicData;
      const update = db.prepare('UPDATE epics SET name = ?, description = ?, status = ?, updated_at = ? WHERE epic_key = ?');
      update.run(name, description, status, new Date().toISOString(), epicKey);
      const updatedEpic = await this.getEpicByKey(epicKey);
      return updatedEpic;
    } catch (error: any) {
      logger.error('Error updating epic:', error);
      throw new Error(error.message || 'Failed to update epic');
    }
  }

  async deleteEpic(epicKey: string): Promise<void> {
    try {
      await db.prepare('DELETE FROM epics WHERE epic_key = ?').run(epicKey);
    } catch (error: any) {
      logger.error('Error deleting epic:', error);
      throw new Error(error.message || 'Failed to delete epic');
    }
  }

  async getIssuesByEpicKey(epicKey: string): Promise<any[]> {
    try {
      const issues = await db.prepare('SELECT * FROM issues WHERE epic_key = ?').all(epicKey);
      return issues;
    } catch (error: any) {
      logger.error('Error fetching issues by epic key:', error);
      throw new Error(error.message || 'Failed to get issues by epic key');
    }
  }
}
