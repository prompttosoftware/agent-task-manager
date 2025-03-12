// tests/issueDelete.test.ts
import { deleteIssue } from '../src/services/issueService'; // Assuming you have a deleteIssue function

// Mock the attachment deletion function (replace with your actual implementation if it exists)
jest.mock('../src/services/issueService', () => ({
    ...jest.requireActual('../src/services/issueService'),
    deleteIssue: jest.fn().mockImplementation(async (issueKey: string) => {
        // Simulate issue deletion, but do NOT delete attachments (this will make the test fail)
        // In a real implementation, this is where the attachment deletion would happen.
        return true; // Indicate success, but attachments are NOT deleted
    }),
}));


describe('Issue Deletion with Attachment Handling', () => {
    it('should delete attachments when an issue is deleted', async () => {
        const issueKey = 'ATM-123'; // Replace with a valid issue key for testing

        // Mock the attachment service or however attachments are handled (replace with your actual implementation)
        const mockDeleteAttachment = jest.fn();
        jest.mock('../src/services/attachmentService', () => ({
            deleteAttachment: mockDeleteAttachment,
        }));

        // Act: Delete the issue
        await deleteIssue(issueKey);

        // Assert: Check if the attachment deletion was called (it shouldn't be for now)
        // The test should fail because attachment deletion is not implemented yet.
        expect(mockDeleteAttachment).toHaveBeenCalled();
    });
});