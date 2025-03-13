// src/services/issueCreateMetaService.ts

export interface IssueType {
  id: string;
  description: string;
  name: string;
  subtask: boolean;
  hierarchyLevel: number;
  fields: any;
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
        fields: { /* Example fields metadata */ },
      },
      {
        id: '10001',
        description: 'A bug',
        name: 'Bug',
        subtask: false,
        hierarchyLevel: 0,
        fields: { /* Example fields metadata */ },
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
