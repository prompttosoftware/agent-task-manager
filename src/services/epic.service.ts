// EpicService.ts

interface EpicService {
  getEpicByKey(epicKey: string): Promise<any | null>;
  getAllEpics(): Promise<any[]>;
  createEpic(epicData: any): Promise<any>;
  updateEpic(epicKey: string, epicData: any): Promise<any>;
  deleteEpic(epicKey: string): Promise<void>;
  getIssuesByEpicKey(epicKey: string): Promise<any[]>;
}


class EpicService implements EpicService {
  private dataStore: any; // Assuming dataStore is injected or initialized elsewhere

  constructor(dataStore: any) {
    this.dataStore = dataStore;
  }


  async getEpicByKey(epicKey: string): Promise<any | null> {
    try {
      const epic = await this.dataStore.getEpic(epicKey);
      return epic || null; // Return null if not found
    } catch (error) {
      console.error(`Error getting epic by key ${epicKey}:`, error);
      return null; // Or throw error, depending on desired behavior
    }
  }

  async getAllEpics(): Promise<any[]> {
    try {
      const epics = await this.dataStore.getAllEpics();
      return epics;
    } catch (error) {
      console.error('Error getting all epics:', error);
      return []; // Or throw error, depending on desired behavior
    }
  }

  async createEpic(epicData: any): Promise<any> {
    try {
      const createdEpic = await this.dataStore.createEpic(epicData);
      return createdEpic;
    } catch (error) {
      console.error('Error creating epic:', error);
      throw error; // Re-throw to propagate the error, or return null or specific error object
    }
  }

  async updateEpic(epicKey: string, epicData: any): Promise<any> {
    try {
      const updatedEpic = await this.dataStore.updateEpic(epicKey, epicData);
      return updatedEpic;
    } catch (error) {
      console.error(`Error updating epic ${epicKey}:`, error);
      throw error; // Re-throw to propagate the error, or return null or specific error object
    }
  }

  async deleteEpic(epicKey: string): Promise<void> {
    try {
      await this.dataStore.deleteEpic(epicKey);
    } catch (error) {
      console.error(`Error deleting epic ${epicKey}:`, error);
      throw error; // Re-throw to propagate the error, or handle as appropriate
    }
  }

  async getIssuesByEpicKey(epicKey: string): Promise<any[]> {
    try {
      const issues = await this.dataStore.getIssuesByEpicKey(epicKey);
      return issues;
    } catch (error) {
      console.error(`Error getting issues for epic ${epicKey}:`, error);
      return []; // Or throw error, depending on desired behavior
    }
  }
}

export default EpicService;
