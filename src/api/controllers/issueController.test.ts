import { Request, Response } from 'express';
import { createIssue } from './issueController'; // Adjust path based on actual location

// Mock the request and response objects
const mockRequest = (body = {}) => ({
  body,
} as Request);

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnThis(); // Allows chaining like res.status(201).json(...)
  res.json = jest.fn();
  res.send = jest.fn(); // In case send is used instead of json
  return res;
};

describe('createIssue', () => {
  it('should return 201 and a success message upon successful issue creation', async () => {
    // Arrange
    const req = mockRequest({
      issueType: 'Bug',
      summary: 'Test Issue',
      status: 'Open',
    });
    const res = mockResponse();

    // Act
    await createIssue(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Issue created successfully (simulation)',
      data: expect.objectContaining({
        issueType: 'Bug',
        summary: 'Test Issue',
        status: 'Open',
      }),
    });
  });

  it('should return 400 and an error message when required fields are missing', async () => {
    // Arrange
    const req = mockRequest({
      issueType: '',
      summary: '',
      status: '',
    });
    const res = mockResponse();

    // Act
    await createIssue(req, res);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Missing required fields: issueType, summary, and status are required.' });
  });
});
