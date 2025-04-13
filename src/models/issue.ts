import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../data/db';

interface IssueAttributes {
  id: string;
  summary: string;
  description: string;
  status: string;
  assignee?: string; // Add assignee attribute
  createdAt: Date;
  updatedAt: Date;
}

export class Issue extends Model<IssueAttributes> implements IssueAttributes {
  public id!: string;
  public summary!: string;
  public description!: string;
  public status!: string;
  public assignee?: string; // Add assignee property
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Add any model methods here, if needed
}

Issue.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    summary: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    assignee: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Issue',
    tableName: 'issues',
    timestamps: true,
  }
);

export default Issue;
