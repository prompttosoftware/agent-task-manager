interface Issue {
  id: string;
  summary: string;
  description: string;
  project: string;
  issueType: string;
  parent?: string;
}

const issues: Issue[] = [];

export const saveIssue = (issue: Issue): Issue => {
  issues.push(issue);
  return issue;
};

export const getAllIssues = (): Issue[] => {
  return [...issues]; // Return a copy to prevent external modification
};

export const clearDatabase = () => {
  issues.length = 0; // Clear the array
};
