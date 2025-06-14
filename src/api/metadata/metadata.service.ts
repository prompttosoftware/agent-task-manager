// src/api/metadata/metadata.service.ts

import { IssueType } from '../../config/static-data';

export class MetadataService {
  public async getCreateMeta(): Promise<any> {
    const projectKey = 'TASK'; // Extract project key from issue key
    const projectName = 'Task Project'; // Replace with actual project name if available

    const projects = [
      {
        expand: 'issuetypes',
        self: `http://localhost:3000/rest/api/2/project/${projectKey}`,
        id: '10000',
        key: projectKey,
        name: projectName,
        avatarUrls: {
          '48x48': 'http://localhost:3000/secure/projectavatar?pid=10000&avatarId=10000',
          '24x24': 'http://localhost:3000/secure/projectavatar?size=small&pid=10000&avatarId=10000',
          '16x16': 'http://localhost:3000/secure/projectavatar?size=xsmall&pid=10000&avatarId=10000',
          '32x32': 'http://localhost:3000/secure/projectavatar?size=medium&pid=10000&avatarId=10000',
        },
        issuetypes: Object.values(IssueType).filter(item => typeof item === 'number').map((issueType) => ({
          self: `http://localhost:3000/rest/api/2/issuetype/${issueType}`,
          id: String(issueType),
          description: `Description for ${IssueType[issueType]}`,
          iconUrl: 'http://localhost:3000/images/icons/issuetypes/task.svg',
          name: IssueType[issueType],
          subtask: false,
          expand: 'fields',
        })),
      },
    ];

    const values = projects.map((project) => ({
      expand: project.expand,
      self: project.self,
      id: project.id,
      key: project.key,
      name: project.name,
      avatarUrls: project.avatarUrls,
      issuetypes: project.issuetypes.map((issueType) => ({
        self: issueType.self,
        id: issueType.id,
        description: issueType.description,
        iconUrl: issueType.iconUrl,
        name: issueType.name,
        subtask: issueType.subtask,
        expand: issueType.expand,
        fields: {
          summary: {
            required: true,
            schema: {
              type: 'string',
              system: 'summary',
            },
            name: 'Summary',
            key: 'summary',
            hasDefaultValue: false,
            operations: ['set'],
          },
          description: {
            required: false,
            schema: {
              type: 'string',
              system: 'description',
            },
            name: 'Description',
            key: 'description',
            hasDefaultValue: false,
            operations: ['set'],
          },
          assignee: {
            required: false,
            schema: {
              type: 'user',
              system: 'assignee',
            },
            name: 'Assignee',
            key: 'assignee',
            hasDefaultValue: false,
            operations: ['set'],
          },
        },
      })),
    }));

    return { projects: values };
  }
}
