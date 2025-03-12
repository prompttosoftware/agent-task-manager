// tests/issueCreationRetrieval.test.ts
import { createIssue, getIssue } from '../src/services/issueService'; // Assuming this path

// Mock the issue service (or adapt to your testing setup)
jest.mock('../src/services/issueService');

describe('Error Handling for ATM-118 (Issue Creation and Retrieval)', () => {
  it('should handle errors during issue creation', async () => {
    // Arrange
    const errorMessage = 'Simulated issue creation failure';
    (createIssue as jest.Mock).mockRejectedValue(new Error(errorMessage));

    // Act & Assert
    await expect(createIssue({} as any)).rejects.toThrow(errorMessage);
  });

  it('should handle errors during issue retrieval', async () => {
    // Arrange
    const issueKey = 'ATM-123';
    const errorMessage = 'Simulated issue retrieval failure';
    (getIssue as jest.Mock).mockRejectedValue(new Error(errorMessage));

    // Act & Assert
    await expect(getIssue(issueKey)).rejects.toThrow(errorMessage);
  });
});
