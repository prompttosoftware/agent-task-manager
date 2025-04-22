import { Issue } from '../models/issue';

// Define the structure of the response object, mimicking a Jira API response.
interface IssueResponse {
    expand: string;
    id: string;     // Corresponds to Issue._id based on the provided model
    key: string;    // Corresponds to Issue.key
    self: string;   // URL pointing to the issue resource
    fields: {
        summary: string;
        // Potentially other fields could be added here if needed
    };
    summary?: string; // Optional top-level summary, kept for consistency if expected by consumers
}

/**
 * Formats a single issue object from the local data model to the desired response format.
 * 
 * @param issue - The issue object based on the local `Issue` model (`src/models/issue.ts`).
 * @returns {IssueResponse} - The formatted response object adhering to the `IssueResponse` interface.
 */
export function formatIssueResponse(issue: Issue): IssueResponse {
    // Use issue._id as the unique identifier from the provided Issue model.
    // This identifier will be used for 'id', 'key', and constructing the 'self' URL
    // as per the request requirements and available data model properties.
    const issueIdentifier = issue._id;

    return {
        expand: "schema,names", // Default expand value, can be customized if needed.

        // 1. Use the issue._id property for the 'id' field in the response.
        // Note: The request mentioned 'issue.id', but the provided Issue model has '_id'.
        id: issue._id,

        // 2. Use the issue.key property for the 'key' field in the response.
        key: issue.key,

        // 3. Update the self URL to correctly use the issue identifier (_id).
        // The URL format mimics Jira's REST API structure.
        self: `/rest/api/3/issue/${issue.key}`,

        // Include the summary both at the top level (optional) and within the 'fields' object.
        summary: issue.summary, // Optional top-level summary.
        fields: {
            summary: issue.summary,
            // Future fields from the Issue model like 'description', 'issuetype', 'parentKey'
            // could be added to the 'fields' object here if required by the response structure.
            // description: issue.description,
            // issuetype: { name: issue.issuetype }, // Example: Map issuetype string to an object
        },
    };
}

/**
 * Formats an array of issue objects using the `formatIssueResponse` function.
 * 
 * @param issues - An array of issue objects based on the local `Issue` model.
 * @returns {IssueResponse[]} - An array of formatted response objects.
 */
export function formatIssuesResponse(issues: Issue[]): IssueResponse[] {
    // Map each issue in the input array to the formatted response structure.
    return issues.map(issue => formatIssueResponse(issue));
}