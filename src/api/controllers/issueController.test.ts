import { Request, Response } from 'express';
import { createIssue } from './issueController'; // Adjust path based on actual location

// Mock the request and response objects
const mockRequest = (body = {}) => ({
  body,
} as Request);

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnThis();
  res.json = jest.fn();
  res.send = jest.fn();
  return res;
};

describe('createIssue', () => {
  it('should return 201 and a success message upon successful issue creation', async () => {
    const req = mockRequest({
      issueType: 'Bug',
      summary: 'Test Issue',
      status: 'Open',
    });
    const res = mockResponse();

    await createIssue(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Issue created successfully (simulation)',
      data: { issueType: 'Bug', summary: 'Test Issue', status: 'Open' },
    });
  });

  it('should return 400 and an error message when issueType is missing', async () => {
    const req = mockRequest({
      summary: 'Test Issue',
      status: 'Open',
    });
    const res = mockResponse();

    await createIssue(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Missing required fields: issueType, summary, and status are required.',
    });
  });

  it('should return 400 and an error message when summary is missing', async () => {
    const req = mockRequest({
      issueType: 'Bug',
      status: 'Open',
    });
    const res = mockResponse();

    await createIssue(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Missing required fields: issueType, summary, and status are required.',
    });
  });

  it('should return 400 and an error message when status is missing', async () => {
    const req = mockRequest({
      issueType: 'Bug',
      summary: 'Test Issue',
    });
    const res = mockResponse();

    await createIssue(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Missing required fields: issueType, summary, and status are required.',
    });
  });

  it('should return 400 and an error message when issueType is an empty string', async () => {
    const req = mockRequest({
      issueType: '',
      summary: 'Test Issue',
      status: 'Open',
    });
    const res = mockResponse();

    await createIssue(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Missing required fields: issueType, summary, and status are required.',
    });
  });

  it('should return 400 and an error message when summary is an empty string', async () => {
    const req = mockRequest({
      issueType: 'Bug',
      summary: '',
      status: 'Open',
    });
    const res = mockResponse();

    await createIssue(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Missing required fields: issueType, summary, and status are required.',
    });
  });

  it('should return 400 and an error message when status is an empty string', async () => {
    const req = mockRequest({
      issueType: 'Bug',
      summary: 'Test Issue',
      status: '',
    });
    const res = mockResponse();

    await createIssue(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Missing required fields: issueType, summary, and status are required.',
    });
  });
});
