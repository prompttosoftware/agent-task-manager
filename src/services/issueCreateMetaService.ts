// src/services/issueCreateMetaService.ts

export interface IssueType {
  id: string;
  description: string;
  name: string;
  subtask: boolean;
  hierarchyLevel: number;
  fields: {
    [key: string]: {
      type: string; // e.g., "string", "number", "array", "user", "project", "select"
      required: boolean;
      name: string;
      description?: string;
      allowedValues?: string[]; // For select fields
      // Add other field-specific properties as needed
    };
  };
}

export interface Project {
  id: string;
  key: string;
  name: string;
  issuetypes: IssueType[];
}

const projects: Project[] = [
  {
    id: '1',
    key: 'ATM',
    name: 'Agent Task Manager',
    issuetypes: [
      {
        id: '10000',
        description: 'A task',
        name: 'Task',
        subtask: false,
        hierarchyLevel: 0,
        fields: {
          summary: {
            type: 'string',
            required: true,
            name: 'Summary',
            description: 'Brief summary of the task',
          },
          description: {
            type: 'string',
            required: false,
            name: 'Description',
            description: 'Detailed description of the task',
          },
          assignee: {
            type: 'user',
            required: false,
            name: 'Assignee',
            description: 'The person responsible for the task',
          },
          priority: {
            type: 'select',
            required: true,
            name: 'Priority',
            description: 'The priority of the task',
            allowedValues: ['Highest', 'High', 'Medium', 'Low', 'Lowest'],
          },
        },
      },
      {
        id: '10001',
        description: 'A bug',
        name: 'Bug',
        subtask: false,
        hierarchyLevel: 0,
        fields: {
          summary: {
            type: 'string',
            required: true,
            name: 'Summary',
            description: 'Brief summary of the bug',
          },
          description: {
            type: 'string',
            required: false,
            name: 'Description',
            description: 'Detailed description of the bug',
          },
          assignee: {
            type: 'user',
            required: false,
            name: 'Assignee',
            description: 'The person responsible for the bug fix',
          },
          priority: {
            type: 'select',
            required: true,
            name: 'Priority',
            description: 'The priority of the bug',
            allowedValues: ['Highest', 'High', 'Medium', 'Low', 'Lowest'],
          },
          environment: {
            type: 'string',
            required: false,
            name: 'Environment',
            description: 'The environment where the bug was found',
          },
        },
      },
    ],
  },
];

export async function getIssueCreateMetadata(
  projectKeys?: string[],
  issueTypeNames?: string[]
): Promise<{
  projects: Project[];
}> {
  let filteredProjects = projects;

  if (projectKeys) {
    filteredProjects = filteredProjects.filter((project) =>
      projectKeys.includes(project.key)
    );
  }

  if (issueTypeNames) {
    filteredProjects = filteredProjects.map((project) => {
      const filteredIssueTypes = project.issuetypes.filter((issueType) =>
        issueTypeNames.includes(issueType.name)
      );
      return {
        ...project,
        issuetypes: filteredIssueTypes,
      };
    });
  }

  // Validate projectKeys and issueTypeNames
  if (projectKeys) {
    const validProjectKeys = projects.map(p => p.key);
    if (!projectKeys.every(key => validProjectKeys.includes(key))) {
      throw new Error('Invalid projectKeys or issueTypeNames');
    }
  }

  if (issueTypeNames) {
    const validIssueTypeNames = projects.flatMap(p => p.issuetypes.map(it => it.name));
    if (!issueTypeNames.every(name => validIssueTypeNames.includes(name))) {
      throw new Error('Invalid projectKeys or issueTypeNames');
    }
  }


  return {
    projects: filteredProjects,
  };
}
