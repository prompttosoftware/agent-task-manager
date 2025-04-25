import { formatIssueResponse, formatIssuesResponse, IssueResponse } from './jsonTransformer'; // Import IssueResponse here
import { Issue } from '../models/issue'; // Assuming Issue model is defined in ../models/issue

// No longer need PartialIssue, the function signature (Issue | null | undefined)[] is sufficient

describe('jsonTransformer', () => {
    describe('formatIssueResponse', () => {
        // Happy path test
        it('should transform a standard Issue object into the IssueResponse format correctly', () => {
            const issue: Issue = {
                _id: '123',
                issuetype: 'Bug',
                summary: 'Test Summary',
                description: 'Test Description',
                key: 'TEST-123',
            };

            const expectedResponse: IssueResponse = {
                expand: "schema,names",
                id: '123',
                key: 'TEST-123',
                self: '/rest/api/3/issue/TEST-123',
                fields: {
                    summary: 'Test Summary',
                },
                summary: 'Test Summary', // Included at top level as per original function
            };

            const actualResponse = formatIssueResponse(issue);
            // Basic check that it's not null before deep equality
            expect(actualResponse).not.toBeNull();
            expect(actualResponse).toEqual(expectedResponse);
        });

        // Edge Case: Missing optional properties (handled by Issue type structure)
        it('should transform an Issue object with only required fields', () => {
             const issue: Issue = {
                _id: 'minimal-456',
                key: 'MIN-001',
                summary: 'Minimal data',
                 issuetype: 'Task',
                 description: '', // Assuming description is required but can be empty
            };

            const expectedResponse: IssueResponse = {
                expand: "schema,names",
                id: 'minimal-456',
                key: 'MIN-001',
                self: '/rest/api/3/issue/MIN-001',
                fields: {
                    summary: 'Minimal data',
                },
                summary: 'Minimal data',
            };

            const actualResponse = formatIssueResponse(issue);
            expect(actualResponse).not.toBeNull(); // Add null check
            expect(actualResponse).toEqual(expectedResponse);
        });

        // Edge Case: Empty string values for required string properties
        it('should handle empty strings for properties like summary and key', () => {
             const issue: Issue = {
                _id: 'empty-789',
                key: '', // Testing empty key
                summary: '', // Testing empty summary
                issuetype: 'Story',
                description: 'Description here',
            };

            const expectedResponse: IssueResponse = {
                expand: "schema,names",
                id: 'empty-789',
                key: '', // Expect empty key to be passed through
                self: '/rest/api/3/issue/', // Expect self URL to be potentially odd with empty key
                fields: {
                    summary: '', // Expect empty summary
                },
                summary: '', // Expect empty summary
            };

            const actualResponse = formatIssueResponse(issue);
            expect(actualResponse).not.toBeNull(); // Add null check
            expect(actualResponse).toEqual(expectedResponse);
        });

        // Edge Case: Special characters in summary
        it('should correctly handle special characters in summary', () => {
            const issue: Issue = {
                _id: 'special-101',
                key: 'SPEC-1',
                summary: 'Summary with "quotes", <tags>, & symbols, \nnewlines, 😊 emojis',
                issuetype: 'Bug',
                description: 'Description with special chars',
            };

            const expectedResponse: IssueResponse = {
                expand: "schema,names",
                id: 'special-101',
                key: 'SPEC-1',
                self: '/rest/api/3/issue/SPEC-1',
                fields: {
                    summary: 'Summary with "quotes", <tags>, & symbols, \nnewlines, 😊 emojis',
                },
                summary: 'Summary with "quotes", <tags>, & symbols, \nnewlines, 😊 emojis',
            };

            const actualResponse = formatIssueResponse(issue);
            // Add null check before accessing properties
            expect(actualResponse).not.toBeNull();
            expect(actualResponse).toEqual(expectedResponse);

            // Ensure actualResponse is not null before accessing its properties
            if (actualResponse) {
                // Specifically check the summary field for exact match including special chars
                expect(actualResponse.fields.summary).toBe(issue.summary);
                expect(actualResponse.summary).toBe(issue.summary);
            } else {
                // Fail the test explicitly if actualResponse is null unexpectedly
                fail('actualResponse should not be null for valid input');
            }
        });


        // Updated Test: Input is null - should return null, not throw
        it('should return null when the input issue object is null', () => {
            // Pass null, which matches the function signature Issue | null | undefined
            const actualResponse = formatIssueResponse(null);
            expect(actualResponse).toBeNull();
        });

        // Updated Test: Input is undefined - should return null, not throw
        it('should return null when the input issue object is undefined', () => {
            // Pass undefined, which matches the function signature Issue | null | undefined
            const actualResponse = formatIssueResponse(undefined);
            expect(actualResponse).toBeNull();
        });
    });

    describe('formatIssuesResponse', () => {
        // Happy path test
        it('should transform an array of Issue objects into an array of IssueResponse objects', () => {
            // This array type Issue[] is assignable to (Issue | null | undefined)[]
            const issues: Issue[] = [
                {
                    _id: '123',
                    issuetype: 'Bug',
                    summary: 'Test Summary 1',
                    description: 'Test Description 1',
                    key: 'TEST-123',
                },
                {
                    _id: '456',
                    issuetype: 'Task',
                    summary: 'Test Summary 2',
                    description: 'Test Description 2',
                    key: 'TEST-456',
                },
            ];

            const expectedResponse: IssueResponse[] = [
                {
                    expand: "schema,names",
                    id: '123',
                    key: 'TEST-123',
                    self: '/rest/api/3/issue/TEST-123',
                    fields: {
                        summary: 'Test Summary 1',
                    },
                    summary: 'Test Summary 1',
                },
                {
                    expand: "schema,names",
                    id: '456',
                    key: 'TEST-456',
                    self: '/rest/api/3/issue/TEST-456',
                    fields: {
                        summary: 'Test Summary 2',
                    },
                    summary: 'Test Summary 2',
                },
            ];

            const actualResponse = formatIssuesResponse(issues);
            expect(actualResponse).toEqual(expectedResponse);
        });

        // Edge Case: Empty input array
        it('should return an empty array when given an empty array of issues', () => {
            const issues: Issue[] = [];
            const expectedResponse: IssueResponse[] = [];

            const actualResponse = formatIssuesResponse(issues);
            expect(actualResponse).toEqual(expectedResponse);
            expect(actualResponse.length).toBe(0);
        });

        // Edge Case: Array contains mixed valid and "edge case" issues
        it('should correctly transform an array containing issues with edge case data', () => {
             // This array type Issue[] is assignable to (Issue | null | undefined)[]
             const issues: Issue[] = [
                {
                    _id: 'valid-1',
                    key: 'VALID-1',
                    summary: 'Valid Summary',
                    issuetype: 'Task',
                    description: 'Desc 1',
                },
                {
                    _id: 'empty-1',
                    key: '', // Empty key
                    summary: '', // Empty summary
                    issuetype: 'Bug',
                    description: 'Desc 2',
                },
                 {
                    _id: 'special-1',
                    key: 'SPEC-CHARS',
                    summary: 'Special chars summary <>"&😊',
                    issuetype: 'Story',
                    description: 'Desc 3',
                },
            ];

            const expectedResponse: IssueResponse[] = [
                 {
                    expand: "schema,names",
                    id: 'valid-1',
                    key: 'VALID-1',
                    self: '/rest/api/3/issue/VALID-1',
                    fields: { summary: 'Valid Summary' },
                    summary: 'Valid Summary',
                 },
                 {
                     expand: "schema,names",
                     id: 'empty-1',
                     key: '',
                     self: '/rest/api/3/issue/',
                     fields: { summary: '' },
                     summary: '',
                 },
                 {
                     expand: "schema,names",
                     id: 'special-1',
                     key: 'SPEC-CHARS',
                     self: '/rest/api/3/issue/SPEC-CHARS',
                     fields: { summary: 'Special chars summary <>"&😊' },
                     summary: 'Special chars summary <>"&😊',
                 },
            ];

             const actualResponse = formatIssuesResponse(issues);
             expect(actualResponse).toEqual(expectedResponse);
        });

         // Updated Test: Input array contains null - should filter out null
         it('should filter out null elements from the input array', () => {
             // Define the array type explicitly to match the function signature
             const issuesWithNull: (Issue | null)[] = [
                 { _id: 'valid-1', key: 'VALID-1', summary: 'Valid', issuetype: 'Task', description: '' },
                 null, // Intentionally include null
                 { _id: 'valid-2', key: 'VALID-2', summary: 'Valid 2', issuetype: 'Bug', description: '' },
             ];

             const expectedResponse: IssueResponse[] = [
                 {
                     expand: "schema,names",
                     id: 'valid-1',
                     key: 'VALID-1',
                     self: '/rest/api/3/issue/VALID-1',
                     fields: { summary: 'Valid' },
                     summary: 'Valid',
                  },
                  {
                      expand: "schema,names",
                      id: 'valid-2',
                      key: 'VALID-2',
                      self: '/rest/api/3/issue/VALID-2',
                      fields: { summary: 'Valid 2' },
                      summary: 'Valid 2',
                  },
             ];

             // Pass the array which matches the function signature (Issue | null | undefined)[]
             const actualResponse = formatIssuesResponse(issuesWithNull);
             expect(actualResponse).toEqual(expectedResponse);
             expect(actualResponse.length).toBe(2); // Ensure null was filtered
         });

         // Updated Test: Input array contains undefined - should filter out undefined
         it('should filter out undefined elements from the input array', () => {
             // Define the array type explicitly to match the function signature
             const issuesWithUndefined: (Issue | undefined)[] = [
                 { _id: 'valid-1', key: 'VALID-1', summary: 'Valid', issuetype: 'Task', description: '' },
                 undefined, // Intentionally include undefined
                 { _id: 'valid-2', key: 'VALID-2', summary: 'Valid 2', issuetype: 'Bug', description: '' },
             ];

             const expectedResponse: IssueResponse[] = [
                {
                    expand: "schema,names",
                    id: 'valid-1',
                    key: 'VALID-1',
                    self: '/rest/api/3/issue/VALID-1',
                    fields: { summary: 'Valid' },
                    summary: 'Valid',
                 },
                 {
                     expand: "schema,names",
                     id: 'valid-2',
                     key: 'VALID-2',
                     self: '/rest/api/3/issue/VALID-2',
                     fields: { summary: 'Valid 2' },
                     summary: 'Valid 2',
                 },
            ];

             // Pass the array which matches the function signature (Issue | null | undefined)[]
             const actualResponse = formatIssuesResponse(issuesWithUndefined);
             expect(actualResponse).toEqual(expectedResponse);
             expect(actualResponse.length).toBe(2); // Ensure undefined was filtered
         });

         // Updated Test: Input array itself is null - should return empty array
         it('should return an empty array when the input array itself is null', () => {
             // Test the function's internal !issues check for null input
             const actualResponse = formatIssuesResponse(null as any); // Use `as any` to bypass strict type checking for the test input
             expect(actualResponse).toEqual([]);
             expect(actualResponse.length).toBe(0);
         });

         // Updated Test: Input array itself is undefined - should return empty array
         it('should return an empty array when the input array itself is undefined', () => {
             // Test the function's internal !issues check for undefined input
             const actualResponse = formatIssuesResponse(undefined as any); // Use `as any` to bypass strict type checking for the test input
             expect(actualResponse).toEqual([]);
             expect(actualResponse.length).toBe(0);
         });
    });
});