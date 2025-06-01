// src/issueService.create.logging.test.ts

import { createIssue } from './issueService'; // Corrected path
import logger from './utils/logger'; // Corrected path
import { loadDatabase, saveDatabase } from './database/database'; // Corrected path
import * as keyGenerator from './utils/keyGenerator'; // Corrected path
import { v4 as uuidv4 } from 'uuid';
import { DbSchema, CreateIssueInput, Task, Story, Epic, AnyIssue } from './models'; // Corrected path
import { IssueCreationError } from './utils/errorHandling'; // Corrected path

// Mock definitions
jest.mock('./utils/logger', () => ({ // Corrected path
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

jest.mock('./database/database', () => ({ // Corrected path
  loadDatabase: jest.fn(),
  saveDatabase: jest.fn(),
  DB_FILE_PATH: '/test/db.json', // Mocked, though not directly used by createIssue
}));

jest.mock('./utils/keyGenerator', () => ({ // Corrected path
  generateIssueKey: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

// Mock type assertions for TypeScript
const mockLoggerInfo = logger.info as jest.Mock;
const mockLoggerWarn = logger.warn as jest.Mock;
const mockLoggerError = logger.error as jest.Mock;
const mockLoadDatabase = loadDatabase as jest.Mock;
const mockSaveDatabase = saveDatabase as jest.Mock;
const mockGenerateIssueKey = keyGenerator.generateIssueKey as jest.Mock;
const mockUuidv4 = uuidv4 as jest.Mock;


describe('createIssue Logging', () => {
  const baseDbSchema: DbSchema = {
    issues: [],
    issueKeyCounter: 0,
  };

  const defaultIssueInput: CreateIssueInput = {
    title: 'Test Issue',
    description: 'A test description',
    issueTypeName: 'Task',
  };

  beforeEach(() => {
    mockLoggerInfo.mockReset();
    mockLoggerWarn.mockReset();
    mockLoggerError.mockReset();
    mockLoadDatabase.mockReset();
    mockSaveDatabase.mockReset();
    mockGenerateIssueKey.mockReset();
    mockUuidv4.mockReset();

    // Default successful mock implementations
    mockLoadDatabase.mockResolvedValue(JSON.parse(JSON.stringify(baseDbSchema))); // Deep copy
    mockSaveDatabase.mockResolvedValue(undefined);
    mockGenerateIssueKey.mockResolvedValue('TEST-1'); // Default key
    mockUuidv4.mockReturnValue('test-uuid'); // Default UUID
  });

  it('should log correctly on successful issue creation', async () => {
    const input: CreateIssueInput = {
      title: 'Successful Story',
      description: 'This story should be created successfully.',
      issueTypeName: 'Story', // Test a non-default type
    };
    const generatedKey = 'STOR-0'; // Expected key for Story with counter 0
    mockGenerateIssueKey.mockResolvedValue(generatedKey);

    await createIssue(input);

    expect(mockLoggerInfo).toHaveBeenCalledTimes(8);
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(1, 'createIssue: Starting issue creation process', { input });
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(2, 'createIssue: Loading database...');
    expect(mockLoadDatabase).toHaveBeenCalledTimes(1);
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(3, 'createIssue: Database loaded successfully.');
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(4, 'createIssue: Generating issue key', { issueType: 'Story' });
    expect(keyGenerator.generateIssueKey).toHaveBeenCalledWith(baseDbSchema.issueKeyCounter, 'Story');
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(5, 'createIssue: Issue key generated successfully', { newIssueKey: generatedKey });
    expect(mockUuidv4).toHaveBeenCalledTimes(1);
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(6, 'createIssue: Saving database', { issueKey: generatedKey });
    expect(mockSaveDatabase).toHaveBeenCalledTimes(1);
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(7, 'createIssue: Database saved successfully', { issueKey: generatedKey });
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(8, 'createIssue: Issue created successfully', { issueKey: generatedKey });

    expect(mockLoggerWarn).not.toHaveBeenCalled();
    expect(mockLoggerError).not.toHaveBeenCalled();
  });

  it('should log warning and error for missing title', async () => {
    const input: CreateIssueInput = { ...defaultIssueInput, title: '' };
    const expectedError = new IssueCreationError('Issue title is required.', 'MISSING_TITLE', 400);

    await expect(createIssue(input)).rejects.toThrow(expectedError);

    expect(mockLoggerInfo).toHaveBeenCalledTimes(1);
    expect(mockLoggerInfo).toHaveBeenCalledWith('createIssue: Starting issue creation process', { input });

    expect(mockLoggerWarn).toHaveBeenCalledTimes(1);
    expect(mockLoggerWarn).toHaveBeenCalledWith('createIssue: Validation failed - Missing title', { input });

    expect(mockLoggerError).toHaveBeenCalledTimes(1);
    expect(mockLoggerError).toHaveBeenCalledWith('createIssue: Error during issue creation', {
      error: expect.objectContaining({
        name: expectedError.name,
        message: expectedError.message,
        errorCode: expectedError.errorCode,
        statusCode: expectedError.statusCode,
      })
    });
  });

  it('should log warning and error for missing parentKey for Subtask', async () => {
    const input: CreateIssueInput = {
      title: 'Subtask without parent',
      issueTypeName: 'Subtask',
      parentKey: undefined,
    };
    const expectedError = new IssueCreationError('Subtask creation requires a parentKey.', 'INVALID_PARENT_KEY', 400);

    await expect(createIssue(input)).rejects.toThrow(expectedError);

    expect(mockLoggerInfo).toHaveBeenCalledTimes(3); // Start, Load DB, DB Loaded
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(1, 'createIssue: Starting issue creation process', { input });
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(2, 'createIssue: Loading database...');
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(3, 'createIssue: Database loaded successfully.');

    expect(mockLoggerWarn).toHaveBeenCalledTimes(1);
    expect(mockLoggerWarn).toHaveBeenCalledWith('createIssue: Validation failed - Missing parentKey for subtask', { input });

    expect(mockLoggerError).toHaveBeenCalledTimes(1);
    expect(mockLoggerError).toHaveBeenCalledWith('createIssue: Error during issue creation', {
      error: expect.objectContaining({
        name: expectedError.name,
        message: expectedError.message,
        errorCode: expectedError.errorCode,
        statusCode: expectedError.statusCode,
      })
    });
  });

  it('should log warning and error if parent issue is not found for Subtask', async () => {
    const parentKey = 'NON-EXISTENT-EPIC-1';
    const input: CreateIssueInput = {
      title: 'Subtask with missing parent',
      issueTypeName: 'Subtask',
      parentKey: parentKey,
    };
    // loadDatabase returns baseDbSchema (empty issues array) by default
    const expectedError = new IssueCreationError(`Parent issue with key '${parentKey}' not found.`, 'PARENT_NOT_FOUND', 404);

    await expect(createIssue(input)).rejects.toThrow(expectedError);

    expect(mockLoggerInfo).toHaveBeenCalledTimes(3); // Start, Load DB, DB Loaded
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(1, 'createIssue: Starting issue creation process', { input });
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(2, 'createIssue: Loading database...');
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(3, 'createIssue: Database loaded successfully.');

    expect(mockLoggerWarn).toHaveBeenCalledTimes(1);
    expect(mockLoggerWarn).toHaveBeenCalledWith('createIssue: Validation failed - Parent not found', { parentKey });
    expect(mockLoggerError).toHaveBeenCalledTimes(1);
    expect(mockLoggerError).toHaveBeenCalledWith('createIssue: Error during issue creation', {
      error: expect.objectContaining({
        name: expectedError.name,
        message: expectedError.message,
        errorCode: expectedError.errorCode, // Matches 'PARENT_NOT_FOUND' string from service
        statusCode: expectedError.statusCode,
      })
    });
  });

  it('should log warning and error if parent issue type is invalid for Subtask', async () => {
    const parentTaskKey = 'TASK-P1';
    const dbWithInvalidParent: DbSchema = {
      issues: [
        {
          id: 'parent-task-id',
          key: parentTaskKey,
          issueType: 'Task',
          summary: 'Parent Task',
          status: 'Todo',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as Task, // Casting to Task, BaseIssue props are sufficient for this test
      ],
      issueKeyCounter: 1,
    };
    mockLoadDatabase.mockResolvedValue(JSON.parse(JSON.stringify(dbWithInvalidParent)));

    const input: CreateIssueInput = {
      title: 'Subtask with invalid parent type',
      issueTypeName: 'Subtask',
      parentKey: parentTaskKey,
    };
    const expectedErrorMessage = `Issue with key '${parentTaskKey}' has type 'Task', which cannot be a parent of a Subtask. Only Epic or Story issues can be parents of Subtasks.`;
    const expectedError = new IssueCreationError(expectedErrorMessage, 'INVALID_PARENT_TYPE', 400);

    await expect(createIssue(input)).rejects.toThrow(expectedError);

    expect(mockLoggerInfo).toHaveBeenCalledTimes(3); // Start, Load DB, DB Loaded
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(1, 'createIssue: Starting issue creation process', { input });
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(2, 'createIssue: Loading database...');
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(3, 'createIssue: Database loaded successfully.');

    expect(mockLoggerWarn).toHaveBeenCalledTimes(1);
    expect(mockLoggerWarn).toHaveBeenCalledWith('createIssue: Validation failed - Invalid parent type', { parentKey: parentTaskKey, parentType: 'Task' });
    expect(mockLoggerError).toHaveBeenCalledTimes(1);
    expect(mockLoggerError).toHaveBeenCalledWith('createIssue: Error during issue creation', {
      error: expect.objectContaining({
        name: expectedError.name,
        message: expectedError.message,
        errorCode: expectedError.errorCode,
        statusCode: expectedError.statusCode,
      })
    });
  });


  it('should log error correctly for a generic error during database load', async () => {
    const dbError = new Error('Database load failure');
    mockLoadDatabase.mockRejectedValue(dbError);
    const expectedWrappedError = new Error(`Failed to create issue: ${dbError.message}`);

    await expect(createIssue(defaultIssueInput)).rejects.toThrow(expectedWrappedError);

    expect(mockLoggerInfo).toHaveBeenCalledTimes(2); // Start, Load DB
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(1, 'createIssue: Starting issue creation process', { input: defaultIssueInput });
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(2, 'createIssue: Loading database...');

    expect(mockLoggerWarn).not.toHaveBeenCalled();
    expect(mockLoggerError).toHaveBeenCalledTimes(1);
    // The error logged is the original dbError
    expect(mockLoggerError).toHaveBeenCalledWith('createIssue: Error during issue creation', { error: dbError });
  });

  it('should log error correctly for a generic error during database save', async () => {
    const dbSaveError = new Error('Database save failure');
    mockSaveDatabase.mockRejectedValue(dbSaveError);
    const expectedWrappedError = new Error(`Failed to create issue: ${dbSaveError.message}`);
    const generatedKey = 'TEST-1'; // From default mockGenerateIssueKey

    await expect(createIssue(defaultIssueInput)).rejects.toThrow(expectedWrappedError);

    // Logs up to "Saving database"
    expect(mockLoggerInfo).toHaveBeenCalledTimes(6); // Start, Load, Loaded, Gen Key, Key Gen Success, Saving DB
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(1, 'createIssue: Starting issue creation process', { input: defaultIssueInput });
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(2, 'createIssue: Loading database...');
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(3, 'createIssue: Database loaded successfully.');
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(4, 'createIssue: Generating issue key', { issueType: defaultIssueInput.issueTypeName }); // 'Task'
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(5, 'createIssue: Issue key generated successfully', { newIssueKey: generatedKey });
    expect(mockLoggerInfo).toHaveBeenNthCalledWith(6, 'createIssue: Saving database', { issueKey: generatedKey });

    expect(mockLoggerWarn).not.toHaveBeenCalled();
    expect(mockLoggerError).toHaveBeenCalledTimes(1);
    // The error logged is the original dbSaveError
    expect(mockLoggerError).toHaveBeenCalledWith('createIssue: Error during issue creation', { error: dbSaveError });
  });
});
