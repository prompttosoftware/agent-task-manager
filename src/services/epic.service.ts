// src/api/services/issue.service.ts
import { Issue } from '../types/issue.d';

// Assuming you have a way to make API requests (e.g., using fetch or axios)
// and that you have the necessary authentication configured.
const JIRA_API_BASE_URL = 'YOUR_JIRA_API_BASE_URL'; // Replace with your Jira API base URL

interface JiraApiResponse {
    issues: any[]; // Assuming the API returns an array of issues under the 'issues' key
    // Add other properties from the API response if needed (e.g., total, startAt, maxResults)
}

// Helper function to make GET requests to the Jira API
async function jiraGetRequest(endpoint: string, params?: { [key: string]: string }): Promise<any> {
    const url = new URL(`${JIRA_API_BASE_URL}${endpoint}`);
    if (params) {
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    }

    try {
        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Authorization': 'YOUR_JIRA_API_AUTH_HEADER', // Replace with your auth header (e.g., 'Bearer <token>' or 'Basic <base64encoded>')
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            const errorBody = await response.text(); // Attempt to get error details
            throw new Error(`Jira API request failed with status ${response.status}: ${errorBody}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error during Jira API request:', error);
        throw error; // Re-throw to allow the calling function to handle the error.
    }
}


export const createIssue = async (issueData: Issue): Promise<Issue> => {
    // Simulate issue creation logic here.
    return { ...issueData, id: '1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
};

export const updateIssue = async (issueId: number, updateData: Partial<Issue>): Promise<Issue | undefined> => {
  // Simulate issue update logic here.
  // For now, just return the updated data with the id.
  return { id: issueId.toString(), ...updateData, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Issue;
};

export const getIssueById = async (issueId: number): Promise<Issue | undefined> => {
  // Simulate issue retrieval logic here.
  if (issueId === 1) {
    return {
        id: issueId.toString(),
        summary: 'Test Summary',
        description: 'Test Description',
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
  } else {
    return undefined;
  }
};

export const listIssues = async (query?: any): Promise<Issue[]> => {
  // Simulate listing issues logic here.
    const issues: Issue[] = [
        {
            id: '1',
            summary: 'Test Summary',
            description: 'Test Description',
            status: 'open',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
         {
            id: '2',
            summary: 'Test Summary 2',
            description: 'Test Description 2',
            status: 'in progress',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        },
    ];

    if (query && query.status) {
        return issues.filter(issue => issue.status === query.status);
    }

  return issues;
};

export const deleteIssue = async (issueId: number): Promise<void> => {
  // Simulate issue deletion logic here.
  // In a real implementation, you'd interact with a database.
};


interface EpicDetails {
    issueKey: string;
    status: string;
    dependencies: string[]; // Assuming dependencies are represented by issue keys
    tasks: string[]; // Assuming tasks are represented by issue keys
    [key: string]: any; // Allow other fields to be added dynamically
}

export const getEpicDetails = async (epicKey: string): Promise<EpicDetails | undefined> => {
    try {
        // Construct the JQL query.  This example assumes the Epic Link custom field exists.  You might need to adjust this.
        const jql = `cf[10000] = "${epicKey}"`; // Replace 10000 with your Epic Link custom field ID

        const response: JiraApiResponse = await jiraGetRequest('/rest/api/2/search', {
            jql: jql,
            fields: 'summary,status,issuelinks', // Specify the fields you want to retrieve.  Include the fields needed for mapping below.
        });

        if (!response || !response.issues || response.issues.length === 0) {
            return undefined; // Epic not found
        }

        const epicIssue = response.issues[0]; // Assuming the first issue returned is the epic.  Handle potential errors.

        // Map the response to the EpicDetails object.  This is where you extract the data.
        const epicDetails: EpicDetails = {
            issueKey: epicIssue.key,
            status: epicIssue.fields.status.name, // Adjust based on the Jira API response structure.
            dependencies: [], // Populate based on the issuelinks
            tasks: [], // Populate based on the issuelinks
            // Add any other fields you want to extract from the response.
            title: epicIssue.fields.summary,
            description: epicIssue.fields.description, // Assuming you have a description field
            // Add other fields here, mapping them from epicIssue.fields
        };

        // Process dependencies and tasks from issuelinks
        if (epicIssue.fields.issuelinks) {
            epicIssue.fields.issuelinks.forEach((link: any) => {
                if (link.type.name === 'Blocks' || link.type.name === 'Blocked By') { // Adjust link types as needed
                    if (link.outwardIssue) {
                        epicDetails.dependencies.push(link.outwardIssue.key);
                    } else if (link.inwardIssue) {
                        epicDetails.dependencies.push(link.inwardIssue.key);
                    }
                } else if (link.type.name === 'Relates to') { // Adjust link types as needed
                  if (link.outwardIssue) {
                      //Consider tasks
                      epicDetails.tasks.push(link.outwardIssue.key);
                  } else if (link.inwardIssue) {
                      //Consider tasks
                      epicDetails.tasks.push(link.inwardIssue.key);
                  }

                }
            });
        }


        return epicDetails;

    } catch (error) {
        // Consider more specific error handling (e.g., different error messages based on the error type)
        console.error(`Error fetching epic details for ${epicKey}:`, error);
        return undefined; // Or throw the error, depending on how you want to handle it.
    }
};