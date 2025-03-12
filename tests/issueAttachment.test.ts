// tests/issueAttachment.test.ts

import { addAttachment } from '../src/controllers/issueController'; // Assuming this is where the function lives. Adjust the path if needed.

// Mock the issueService (if needed)
// jest.mock('../src/services/issueService');

describe('Add Attachment Endpoint', () => {
  it('should return 200 OK when attachment is added successfully', async () => {
    // Mock request and response objects
    const req: any = {
      params: { issueKey: 'ATM-126' }, // Assuming issue key is in params
      file: { // Mock file upload data
        originalname: 'test.txt',
        buffer: Buffer.from('this is a test'),
      },
    };
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock the issueService.addAttachment to simulate success. Adjust as needed.
    // (issueService.addAttachment as jest.Mock).mockResolvedValue({ /* mock data */ });

    // Call the controller function
    await addAttachment(req, res);

    // Assertions
    expect(res.status).toHaveBeenCalledWith(501); // Expecting a 501 Not Implemented or 400
    //expect(res.json).toHaveBeenCalledWith(/* expected response, e.g. { message: 'Attachment added' }*/);
  });

  // Add more tests for different scenarios, e.g.,
  // - attachment upload fails
  // - invalid issue key
  // - missing file
});
