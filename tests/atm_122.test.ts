// tests/atm_122.test.ts
import request from 'supertest';
import app from '../src/app'; // Adjust the path as necessary

describe('ATM-122 Test - Attachment Handling', () => {
    it('should be able to create an issue with an attachment', async () => {
        const newIssueData = {
            fields: {
                summary: 'Issue with Attachment',
                description: 'This issue includes an attachment.',
                project: { key: 'ATM' },
                issuetype: { name: 'Task' }
            }
        };

        // First, create the issue
        const createIssueResponse = await request(app)
            .post('/api/issue')
            .send(newIssueData)
            .set('Content-Type', 'application/json');

        expect(createIssueResponse.status).toBe(201);
        expect(createIssueResponse.body).toHaveProperty('key');
        const issueKey = createIssueResponse.body.key;

        // Assuming you have an endpoint to upload an attachment. Let's pretend it's /api/issue/:issueKey/attachment
        const attachmentFilePath = 'tests/test_attachment.txt'; // Assuming this file exists

        const attachmentResponse = await request(app)
            .post(`/api/issue/${issueKey}/attachment`)
            .attach('file', attachmentFilePath)

        expect(attachmentResponse.status).toBe(200); // Or whatever status code your attachment endpoint returns on success

        // You might want to add assertions here to verify that the attachment was actually added

    });
});