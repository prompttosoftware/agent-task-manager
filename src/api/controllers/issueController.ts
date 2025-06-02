import { createIssue } from './createIssue';
import { getIssues, getIssue, getIssueByKeyEndpoint } from './readIssues';
import { updateIssueEndpoint } from './updateIssue';
import { deleteIssueEndpoint } from './deleteIssue';

// Re-exporting main endpoint handlers to act as a central point for issue controllers.
// Helper functions like getAllIssues, getIssueById, getIssueByKey are exported from readIssues.ts
// but not re-exported here, as they are intended for internal use or direct import if needed,
// and are slated for refactoring into a service layer.
export { createIssue, getIssues, getIssue, getIssueByKeyEndpoint, updateIssueEndpoint, deleteIssueEndpoint };
