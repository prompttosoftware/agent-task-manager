import { Issue, IssueSchema, validateIssue } from './issue';
import { z } from 'zod'; // Import z for ZodError

describe('Issue Model Interface', () => {
  // These tests remain valid for checking the interface structure itself
  it('should define the Issue interface correctly', () => {
    const issue: Issue = {
      _id: 'testId',
      issuetype: 'Bug',
      summary: 'Test Summary',
      description: 'Test Description',
      key: 'TEST-1'
    };

    expect(issue).toHaveProperty('_id');
    expect(issue).toHaveProperty('issuetype');
    expect(issue).toHaveProperty('summary');
    expect(issue).toHaveProperty('description');
    expect(issue).toHaveProperty('key');
    // parentKey is optional, so no assertion needed unless explicitly testing its presence/absence
  });

  it('should create an Issue object with all properties including optional parentKey', () => {
    const issue: Issue = {
      _id: '123',
      issuetype: 'Bug',
      summary: 'Test Issue',
      description: 'This is a test issue.',
      parentKey: 'PARENT-1',
      key: 'TEST-1',
    };

    expect(issue._id).toBe('123');
    expect(issue.issuetype).toBe('Bug');
    expect(issue.summary).toBe('Test Issue');
    expect(issue.description).toBe('This is a test issue.');
    expect(issue.parentKey).toBe('PARENT-1');
    expect(issue.key).toBe('TEST-1');
  });

    it('should create an Issue object with parentKey explicitly set to null', () => {
    const issue: Issue = {
      _id: '123null',
      issuetype: 'Task',
      summary: 'Test Null Parent',
      description: 'This issue has a null parent.',
      parentKey: null,
      key: 'TEST-NULL',
    };
    expect(issue.parentKey).toBeNull();
    });


  it('should create an Issue object without optional parentKey', () => {
    const issue: Issue = {
      _id: '456',
      issuetype: 'Task',
      summary: 'Another Test Issue',
      description: 'This is another test issue.',
      key: 'TEST-2',
    };

    expect(issue._id).toBe('456');
    expect(issue.issuetype).toBe('Task');
    expect(issue.summary).toBe('Another Test Issue');
    expect(issue.description).toBe('This is another test issue.');
    expect(issue.parentKey).toBeUndefined(); // Check that it's undefined when not provided
    expect(issue.key).toBe('TEST-2');
  });
});

describe('Issue Validation (validateIssue)', () => {
  let validIssueData: any; // Use 'any' for easier modification in tests

  beforeEach(() => {
    // Initialize with valid data before each test
    validIssueData = {
      _id: 'valid-id-123',
      issuetype: 'Story',
      summary: 'Implement validation tests',
      description: 'Add comprehensive tests for the Issue schema validation.',
      parentKey: 'EPIC-1',
      key: 'TASK-101',
    };
  });

  it('should validate a correct issue object with all fields', () => {
    expect(() => validateIssue(validIssueData)).not.toThrow();
    const validated = validateIssue(validIssueData);
    expect(validated).toEqual(validIssueData);
  });

  it('should validate a correct issue object with parentKey as null', () => {
    const data = { ...validIssueData, parentKey: null };
    expect(() => validateIssue(data)).not.toThrow();
    const validated = validateIssue(data);
    expect(validated).toEqual(data);
     expect(validated.parentKey).toBeNull();
  });

  it('should validate a correct issue object with parentKey missing (undefined)', () => {
    const { parentKey, ...dataWithoutParent } = validIssueData;
    expect(() => validateIssue(dataWithoutParent)).not.toThrow();
    const validated = validateIssue(dataWithoutParent);
    expect(validated).toEqual(dataWithoutParent);
    expect(validated.parentKey).toBeUndefined();
  });

  // --- Tests for Invalid Data ---

  // Helper function to check for ZodError with specific path and message
  const expectValidationError = (data: any, expectedPath: string[], expectedMessage: string) => {
    expect(() => validateIssue(data)).toThrow(z.ZodError);
    try {
      validateIssue(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        expect(error.errors.length).toBeGreaterThan(0);
        const relevantError = error.errors.find(e => JSON.stringify(e.path) === JSON.stringify(expectedPath));
        expect(relevantError).toBeDefined();
        expect(relevantError?.message).toBe(expectedMessage);
      } else {
        // Should not reach here if the error is not a ZodError
        throw new Error("Expected ZodError but received different error type.");
      }
    }
  };

  // _id validation
  it('should throw an error if _id is an empty string', () => {
    const invalidData = { ...validIssueData, _id: '' };
    expectValidationError(invalidData, ['_id'], '_id cannot be empty');
  });

  it('should throw an error if _id is missing', () => {
    const { _id, ...invalidData } = validIssueData;
     expectValidationError(invalidData, ['_id'], 'Required'); // Zod's default message for missing required fields
  });

  it('should throw an error if _id is not a string', () => {
    const invalidData = { ...validIssueData, _id: 123 };
    expectValidationError(invalidData, ['_id'], 'Expected string, received number');
  });

  // issuetype validation
  it('should throw an error if issuetype is an empty string', () => {
    const invalidData = { ...validIssueData, issuetype: '' };
    expectValidationError(invalidData, ['issuetype'], 'issuetype cannot be empty');
  });

  it('should throw an error if issuetype is missing', () => {
    const { issuetype, ...invalidData } = validIssueData;
    expectValidationError(invalidData, ['issuetype'], 'Required');
  });

   it('should throw an error if issuetype is not a string', () => {
    const invalidData = { ...validIssueData, issuetype: false };
    expectValidationError(invalidData, ['issuetype'], 'Expected string, received boolean');
  });


  // summary validation
  it('should throw an error if summary is an empty string', () => {
    const invalidData = { ...validIssueData, summary: '' };
    expectValidationError(invalidData, ['summary'], 'summary cannot be empty');
  });

    it('should throw an error if summary is missing', () => {
    const { summary, ...invalidData } = validIssueData;
    expectValidationError(invalidData, ['summary'], 'Required');
  });

   it('should throw an error if summary is not a string', () => {
    const invalidData = { ...validIssueData, summary: null };
    expectValidationError(invalidData, ['summary'], 'Expected string, received null');
  });

  // description validation
  it('should throw an error if description is an empty string', () => {
    const invalidData = { ...validIssueData, description: '' };
    expectValidationError(invalidData, ['description'], 'description cannot be empty');
  });

  it('should throw an error if description is missing', () => {
    const { description, ...invalidData } = validIssueData;
    expectValidationError(invalidData, ['description'], 'Required');
  });

   it('should throw an error if description is not a string', () => {
    const invalidData = { ...validIssueData, description: [] };
    expectValidationError(invalidData, ['description'], 'Expected string, received array');
  });


  // key validation
  it('should throw an error if key is an empty string', () => {
    const invalidData = { ...validIssueData, key: '' };
    expectValidationError(invalidData, ['key'], 'key cannot be empty');
  });

  it('should throw an error if key is missing', () => {
    const { key, ...invalidData } = validIssueData;
    expectValidationError(invalidData, ['key'], 'Required');
  });

   it('should throw an error if key is not a string', () => {
    const invalidData = { ...validIssueData, key: {} };
    expectValidationError(invalidData, ['key'], 'Expected string, received object');
  });

  // parentKey validation (type checking)
  it('should throw an error if parentKey is present but not a string or null', () => {
    const invalidData = { ...validIssueData, parentKey: 123 };
    // Note: Zod schema `z.string().nullable().optional()` handles this.
    // It expects string, null, or undefined. A number is invalid.
    expectValidationError(invalidData, ['parentKey'], 'Expected string, received number');
  });

    // Test with extra unexpected fields
    it('should strip unexpected fields during validation', () => {
        const dataWithExtra = { ...validIssueData, extraField: 'should be removed' };
        const validated = validateIssue(dataWithExtra);
        expect(validated).toEqual(validIssueData); // Extra field should be gone
        expect(validated).not.toHaveProperty('extraField');
    });

    it('should handle input that is not an object', () => {
        expect(() => validateIssue(null)).toThrow(z.ZodError);
        expect(() => validateIssue("not an object")).toThrow(z.ZodError);
        expect(() => validateIssue(12345)).toThrow(z.ZodError);
        try {
            validateIssue(null);
        } catch (error) {
             if (error instanceof z.ZodError) {
                expect(error.errors[0].message).toContain('Expected object, received null');
            } else {
                 throw new Error("Expected ZodError");
            }
        }
    });
});