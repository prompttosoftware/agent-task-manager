// src/repositories/issue.repository.ts
import { Issue } from '../models/issue.model';
import sequelize from '../config/database.config';
import { DataTypes, Model } from 'sequelize';

export class IssueRepository {

    private issueModel =  IssueModel;

  async create(issueData: Partial<Issue>): Promise<Issue> {
      const issue = await this.issueModel.create(issueData);
      return issue.toJSON() as Issue;
  }

  async findById(id: number): Promise<Issue | null> {
    const issue = await this.issueModel.findByPk(id);
    return issue?.toJSON() as Issue | null;
  }

  async update(id: number, issueData: Partial<Issue>): Promise<Issue | null> {
    const [rowsAffected, [updatedIssue]] = await this.issueModel.update(issueData, { where: { id }, returning: true });
    return updatedIssue?.toJSON() as Issue | null;
  }

  async delete(id: number): Promise<void> {
    await this.issueModel.destroy({ where: { id } });
  }
}

class IssueModel extends Model {
    declare id: number;
    declare summary: string;
}

IssueModel.init(
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        summary: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'Issue',
        timestamps: false,
    }
);
