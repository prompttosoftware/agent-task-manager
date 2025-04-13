import { Issue } from '../models/issue.model';
import { CreateIssueDto, UpdateIssueDto } from '../types/issue';
import { Op } from 'sequelize';

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

  async searchIssues(query: string) {
    try {
      const issues = await Issue.findAll({
        where: {
          [Op.or]: [
            {
              summary: {
                [Op.iLike]: `%${query}%`,
              },
            },
            {
              description: {
                [Op.iLike]: `%${query}%`,
              },
            },
          ],
        },
      });
      return issues;
    } catch (error) {
      console.error('Error searching issues:', error);
      throw error;
    }
  }

  async getIssuesByBoard(boardId: string) {
    // Assuming you have a boardId field or some way to relate issues to boards.
    //  Adjust the 'where' clause accordingly based on your actual data structure.
    try {
      const issues = await Issue.findAll({
        where: {
          // Example: Assuming a boardId field exists on the Issue model
          // boardId: boardId,

          //  If no direct relationship, can use a more flexible approach.  For example searching the summary
          // Could also use a join table
          // summary: {
          //  [Op.iLike]: `%${boardId}%`,
          // }
        },
      });
      return issues;
    } catch (error) {
      console.error('Error fetching issues by board:', error);
      throw error;
    }
  }

  async addIssue(issueData: CreateIssueDto) {
    try {
      const issue = await Issue.create(issueData);
      return issue;
    } catch (error) {
      console.error('Error adding issue:', error);
      throw error;
    }
  }
}
