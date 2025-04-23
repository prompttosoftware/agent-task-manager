import { formatIssueResponse, formatIssuesResponse } from './jsonTransformer';
import { Issue } from '../models/issue';

describe('jsonTransformer', () => {
    describe('formatIssueResponse', () => {
        it('should transform an Issue object into the IssueResponse format correctly', () => {
            const issue: Issue = {
                _id: '123',
                issuetype: 'Bug',
                summary: 'Test Summary',
                description: 'Test Description',
                key: 'TEST-123',
            };

            const expectedResponse = {
                expand: "schema,names",
                id: '123',
                key: 'TEST-123',
                self: '/rest/api/3/issue/TEST-123',
                fields: {
                    summary: 'Test Summary',
                },
                summary: 'Test Summary',
            };

            const actualResponse = formatIssueResponse(issue);

            expect(actualResponse).toEqual(expectedResponse);
        });
    });

    describe('formatIssuesResponse', () => {
        it('should transform an array of Issue objects into an array of IssueResponse objects', () => {
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

            const expectedResponse = [
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

        it('should return an empty array when given an empty array of issues', () => {
            const issues: Issue[] = [];
            const expectedResponse: any[] = [];

            const actualResponse = formatIssuesResponse(issues);

            expect(actualResponse).toEqual(expectedResponse);
        });
    });
});