import { Epic } from '../types/epic.d';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../data/db';

export class EpicService {
  async getEpic(epicKey: string): Promise<Epic | undefined> {
    try {
      const epic = await db.get<Epic>('epics', epicKey);
      return epic;
    } catch (error) {
      console.error('Error fetching epic:', error);
      return undefined;
    }
  }

  async listEpics(): Promise<Epic[]> {
    try {
      const epics = await db.getAll<Epic>('epics');
      return epics;
    } catch (error) {
      console.error('Error listing epics:', error);
      return [];
    }
  }

  async createEpic(epicData: any): Promise<Epic> {
    const newEpic: Epic = {
      epicKey: uuidv4(),
      name: epicData.name,
      description: epicData.description,
      status: epicData.status
    };
    try {
      await db.set('epics', newEpic.epicKey, newEpic);
      return newEpic;
    } catch (error) {
      console.error('Error creating epic:', error);
      throw error; // Re-throw to handle it in the controller
    }
  }

  async updateEpic(epicKey: string, epicData: any): Promise<Epic | undefined> {
    try {
      const existingEpic = await db.get<Epic>('epics', epicKey);
      if (!existingEpic) {
        return undefined;
      }

      const updatedEpic: Epic = { ...existingEpic, ...epicData };
      await db.set('epics', epicKey, updatedEpic);
      return updatedEpic;
    } catch (error) {
      console.error('Error updating epic:', error);
      return undefined;
    }
  }

  async deleteEpic(epicKey: string): Promise<void> {
    try {
      await db.delete('epics', epicKey);
    } catch (error) {
      console.error('Error deleting epic:', error);
      throw error; // Re-throw to handle it in the controller
    }
  }

  async getIssuesForEpic(epicKey: string): Promise<string[]> {
    try {
      const issues = await db.getAllMatching<any>('issues', 'epicKey', epicKey);
      return issues.map(issue => issue.issueKey) || [];
    } catch (error) {
      console.error('Error fetching issues for epic:', error);
      return [];
    }
  }
}