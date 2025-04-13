import { Op } from 'sequelize';
import Issue from '../models/issue';

interface SearchParams {
  keywords?: string;
  status?: string;
  assignee?: string;
  page: number;
  pageSize: number;
}

export const addIssue = async (issueData: any) => {
  try {
    const issue = await Issue.create(issueData);
    return issue;
  } catch (error) {
    throw new Error('Failed to create issue');
  }
};

export const updateIssue = async (issueKey: string, issueData: any) => {
  try {
    const issue = await Issue.findByPk(issueKey);
    if (!issue) {
      return null;
    }
    await issue.update(issueData);
    return issue;
  } catch (error) {
    throw new Error('Failed to update issue');
  }
};

export const deleteIssue = async (issueKey: string) => {
  try {
    const issue = await Issue.findByPk(issueKey);
    if (!issue) {
      return;
    }
    await issue.destroy();
  } catch (error) {
    throw new Error('Failed to delete issue');
  }
};

export const updateAssignee = async (issueKey: string, assignee: string) => {
    try {
        const issue = await Issue.findByPk(issueKey);
        if (!issue) {
            return null;
        }
        await issue.update({ assignee }); // Assuming you add 'assignee' to the Issue model
        return issue;
    } catch (error) {
        throw new Error('Failed to update assignee');
    }
};

export const searchIssuesService = async (searchParams: SearchParams) => {
  try {
    const { keywords, status, assignee, page, pageSize } = searchParams;

    const whereClause: any = {};

    if (keywords) {
      whereClause.summary = { [Op.like]: `%${keywords}%` }; // Example: search in summary
    }

    if (status) {
      whereClause.status = status;
    }

    if (assignee) {
       whereClause.assignee = assignee;
    }

    const offset = (page - 1) * pageSize;

    const { count, rows } = await Issue.findAndCountAll({
      where: whereClause,
      limit: pageSize,
      offset: offset,
    });

    return {
      issues: rows,
      totalCount: count,
    };
  } catch (error) {
    throw new Error('Failed to search issues');
  }
};
