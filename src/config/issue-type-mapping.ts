export const IssueTypeMapping = {
  // Name to ID mapping
  nameToId: {
    'Task': 1,
    'Story': 2,
    'Bug': 3,
    'Subtask': 4,
    'Epic': 5,
  } as const,
  
  // ID to Name mapping
  idToName: {
    1: 'Task',
    2: 'Story',
    3: 'Bug',
    4: 'Subtask',
    5: 'Epic',
  } as const
};

export type IssueTypeName = keyof typeof IssueTypeMapping.nameToId;
export type IssueTypeId = keyof typeof IssueTypeMapping.idToName;

// Helper functions
export const getIssueTypeId = (name: string): number | undefined => {
  return IssueTypeMapping.nameToId[name as IssueTypeName];
};

export const getIssueTypeName = (id: number): string | undefined => {
  return IssueTypeMapping.idToName[id as IssueTypeId];
};
