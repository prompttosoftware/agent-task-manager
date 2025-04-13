import { Issue } from '../models/issue.model';
import { CreateIssueDto, UpdateIssueDto } from '../types/issue';

export class IssueService {
  async createIssue(issueData: CreateIssueDto) {
    try {
      const issue = await Issue.create(issueData);
      return issue;
    } catch (error) {
      console.error('Error creating issue:', error);
      throw error;
    }
  }

  async getIssue(id: string) {
    try {
      const issue = await Issue.findByPk(id);
      return issue;
    } catch (error) {
      console.error('Error fetching issue:', error);
      throw error;
    }
  }

  async updateIssue(id: string, updateData: UpdateIssueDto) {
    try {
      const issue = await Issue.findByPk(id);
      if (!issue) {
        return null; // Or throw an error, depending on your needs
      }
      await issue.update(updateData);
      return issue;
    } catch (error) {
      console.error('Error updating issue:', error);
      throw error;
    }
  }

  async deleteIssue(id: string) {
    try {
      const issue = await Issue.findByPk(id);
      if (!issue) {
        return false; // Or throw an error
      }
      await issue.destroy();
      return true;
    } catch (error) {
      console.error('Error deleting issue:', error);
      throw error;
    }
  }
}
