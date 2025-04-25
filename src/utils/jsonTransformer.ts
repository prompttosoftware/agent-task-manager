import { Issue } from '../models/issue';

// Define the structure of the response object, mimicking a Jira API response.
// Export the interface so it can be used elsewhere, e.g., in API route handlers.
export interface IssueResponse {
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
 * Returns null if the input issue object is null or undefined.
 *
 * @param issue - The issue object based on the local `Issue` model (`src/models/issue.ts`), or null/undefined.
 * @returns {IssueResponse | null} - The formatted response object adhering to the `IssueResponse` interface, or null.
 */
export function formatIssueResponse(issue: Issue | null | undefined): IssueResponse | null {
    // Handle null or undefined input gracefully by returning null.
    if (!issue) {
        return null;
    }

    // Use issue._id as the unique identifier from the provided Issue model.
    // This identifier will be used for 'id', 'key', and constructing the 'self' URL
    // as per the request requirements and available data model properties.
    // We've already checked for null/undefined, so 'issue' is a valid Issue object here.
    const issueIdentifier = issue._id; // Safe access after the null/undefined check

    return {
        expand: "schema,names", // Default expand value, can be customized if needed.

        // 1. Use the issue._id property for the 'id' field in the response.
        id: issue._id,

        // 2. Use the issue.key property for the 'key' field in the response.
        key: issue.key,

        // 3. Update the self URL to correctly use the issue key.
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
 * Formats an array of issue objects using the `formatIssueResponse` function,
 * filtering out any null or undefined elements before formatting.
 *
 * @param issues - An array potentially containing issue objects based on the local `Issue` model, nulls, or undefined values.
 * @returns {IssueResponse[]} - An array of formatted response objects for the valid issues found in the input array.
 */
export function formatIssuesResponse(issues: (Issue | null | undefined)[]): IssueResponse[] {
    // Handle null or undefined input array itself gracefully by returning an empty array.
    if (!issues) {
        return [];
    }

    // 1. Filter out any null or undefined elements from the input array.
    //    The type guard `issue is Issue` ensures that the filtered array only contains valid Issue objects.
    // 2. Map the remaining valid issue objects using `formatIssueResponse`.
    //    Since the input to map is guaranteed non-null by the filter, `formatIssueResponse` will return `IssueResponse`.
    //    The `as IssueResponse` assertion reinforces this, ensuring the final type is `IssueResponse[]`.
    return issues
        .filter((issue): issue is Issue => issue != null) // Filter out null and undefined
        .map(issue => formatIssueResponse(issue) as IssueResponse); // Map valid issues, result is IssueResponse
}