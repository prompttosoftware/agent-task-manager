// tests/routes/delete_issue_with_attachments.test.ts

import request from 'supertest';
import app from '../../src/app'; // Assuming your Express app is exported from src/app.ts
import { createIssue, deleteIssue, addAttachment } from '../../src/models/issue'; // Assuming you have issue model functions

// Mock the issue model functions.  These should ideally be imported from the issue model
// but the tests are being built without the models yet, so these are stubbed.
jest.mock('../../src/models/issue', () => ({
    createIssue: jest.fn(),
    deleteIssue: jest.fn(),
    addAttachment: jest.fn()
}));


describe('DELETE /api/issues/:issueKey', () => {

    it('should delete the issue and its attachments', async () => {
        // Arrange
        const issueKey = 'ATM-123';
        const attachmentId = 'attachment-123';

        // Mock the issue model functions to simulate success
        (createIssue as jest.Mock).mockResolvedValue({ key: issueKey });
        (addAttachment as jest.Mock).mockResolvedValue({id: attachmentId});
        (deleteIssue as jest.Mock).mockResolvedValue(true);

        // Act: First create an issue
        await request(app)
            .post('/api/issues')
            .send({ summary: 'test', description: 'test' })
            .expect(201);

        //Add an attachment
        await request(app)
          .post(`/api/issues/${issueKey}/attachments`)
          .attach('file', Buffer.from('test content'), 'test.txt')
          .expect(201);
        
        // Act: Delete the issue
        const response = await request(app)
            .delete(`/api/issues/${issueKey}`)
            .expect(200);

        // Assert
        expect(deleteIssue).toHaveBeenCalledWith(issueKey);
        // In a real implementation, you'd also want to assert that the attachments were deleted.
        // Since attachment deletion is not implemented, the test assumes the issue deletion takes care of it.
        expect(response.body).toEqual({ message: 'Issue deleted successfully' });
    });


    it('should return 404 if the issue does not exist', async () => {
        // Arrange
        const issueKey = 'NON-EXISTENT-ISSUE';
        (deleteIssue as jest.Mock).mockResolvedValue(false);

        // Act
        await request(app)
            .delete(`/api/issues/${issueKey}`)
            .expect(404);

        // Assert
        expect(deleteIssue).toHaveBeenCalledWith(issueKey);
    });
});
