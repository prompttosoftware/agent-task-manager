import express, { Application } from 'express';
import request from 'supertest';
import issueRoutes from './issueRoutes';
import { AnyIssue } from '../../models'; // Import types
import fs from 'fs'; // Import fs module
import path from 'path'; // Import path module
import { DB_FILE_PATH } from '../../database/database'; // Import the correct DB file path

// Determine the path to db.json - Use the path from dataStore
const dbPath = DB_FILE_PATH; // Use the imported path

// Create a simple Express app instance for testing
const app: Application = express();
app.use(express.json()); // Use express.json() middleware to parse request bodies
app.use('/rest/api/2', issueRoutes); // Mount the issueRoutes router under the correct path

// Add a new describe block for persistence verification tests
describe('POST /rest/api/2/issues - Persistence Verification (Failure Cases)', () => { // Updated describe block name for clarity

  // Ensure db.json is cleared before each test in this block
  beforeEach(async () => { // Made beforeEach async because fs.promises methods return Promises
    try {
      // Ensure the directory exists before writing
      await fs.promises.mkdir(path.dirname(dbPath), { recursive: true });
      // Write an empty state to db.json using promises API for async consistency
      await fs.promises.writeFile(dbPath, JSON.stringify({ issues: [], issueKeyCounter: 0 }, null, 2), 'utf8');
    } catch (error) {
      console.error(`Failed to reset ${dbPath} before test:`, error);
      // Depending on severity, you might want to throw the error or just log
      // throw error; // Re-throw if failure to reset should halt tests
    }
  });

  // Clean up db.json after all tests in this block are done? Optional, but good practice.
  // afterAll(async () => { // Made afterAll async
  //   try {
  //     // await fs.promises.unlink(dbPath); // Or write empty array
  //      await fs.promises.writeFile(dbPath, JSON.stringify({ issues: [], issueKeyCounter: 0 }, null, 2), 'utf8');
  //   } catch (error) {
  //     console.error(`Failed to clean up ${dbPath} after tests:`, error);
  //   }
  // });

  // --- Tests for Invalid Subtask Parent ---

  // Test Case 2: Create Subtask with Non-Existent Parent Key - Persistence Verification
  it('should return 404 and not persist the Subtask issue when parent key does not exist', async () => {
      // Arrange
      const nonExistentParentKey = 'NON-EXISTENT-123';
      const reqBody = {
          fields: {
              issuetype: { name: 'Subtask' },
              summary: 'Subtask with non-existent parent',
              parent: { key: nonExistentParentKey },
          }
      };

      // Act
      const response = await request(app).post('/rest/api/2/issues').send(reqBody);

      // Assert (API response)
      expect(response.status).toBe(404); // Expecting 404 if parent key is not found
      // FIX: Updated assertion to check for 'errorMessages' array instead of single 'error' field
      expect(response.body).toHaveProperty('errorMessages'); // Expecting an errorMessages array in the body
      expect(Array.isArray(response.body.errorMessages)).toBe(true); // Ensure it's an array
      // FIX: Updated assertion to check if the errorMessages array contains the specific message
      expect(response.body.errorMessages).toContain(`Parent issue with key '${nonExistentParentKey}' not found.`); // More specific error message check

      // Assert (Persistence)
      const dbContent = await fs.promises.readFile(dbPath, 'utf8');
      const dbData = JSON.parse(dbContent);

      // Check that no issue was added to the database
      expect(dbData.issues.length).toBe(0);
      // Check that the issue key counter hasn't increased (it should still be 0 because beforeEach sets it)
      expect(dbData.issueKeyCounter).toBe(0);
  });

  // Test Case 3: Create Subtask with Parent of Invalid Type (e.g., Bug) - Persistence Verification
  it('should return 400 and not persist the Subtask issue when parent is a Bug', async () => {
      // Arrange: Create a Bug issue first
      const bugReqBody = {
          fields: {
              issuetype: { name: 'Bug' },
              summary: 'Invalid parent Bug',
          }
      };
      const bugResponse = await request(app).post('/rest/api/2/issues').send(bugReqBody);
      expect(bugResponse.status).toBe(201);
      const bugKey = bugResponse.body.key;
      expect(bugKey).toBeDefined();

      // Construct Subtask request body pointing to the Bug parent
      const subtaskReqBody = {
          fields: {
              issuetype: { name: 'Subtask' },
              summary: 'Subtask with Bug parent',
              parent: { key: bugKey },
          }
      };

      // Act
      const response = await request(app).post('/rest/api/2/issues').send(subtaskReqBody);

      // Assert (API response)
      expect(response.status).toBe(400); // Expecting 400 for invalid parent type
      // FIX: Updated assertion to check for 'errorMessages' array instead of single 'error' field
      expect(response.body).toHaveProperty('errorMessages'); // Expecting an errorMessages array in the body
      expect(Array.isArray(response.body.errorMessages)).toBe(true); // Ensure it's an array
      // FIX: Updated assertion to check if the errorMessages array contains the specific message
      expect(response.body.errorMessages).toContain(`Issue with key '${bugKey}' has type 'Bug', which cannot be a parent of a Subtask. Only Epic or Story issues can be parents of Subtasks.`); // Specific error message check

      // Assert (Persistence)
      const dbContent = await fs.promises.readFile(dbPath, 'utf8');
      const dbData = JSON.parse(dbContent);

      // Check that only the original Bug issue exists
      expect(dbData.issues.length).toBe(1);
      const persistedBug = dbData.issues.find((issue: AnyIssue) => issue.key === bugKey);
      expect(persistedBug).toBeDefined(); // The Bug should still be there
      expect(persistedBug.issueType).toBe('Bug'); // Check its type
      // FIX: Removed assertions about childIssueKeys on the Bug issue, as only Epics track children.
      // A Bug issue should not have a childIssueKeys property according to the model and service logic.

      // Check that the Subtask was NOT added
      const persistedSubtask = dbData.issues.find((issue: AnyIssue) => issue.summary === 'Subtask with Bug parent');
      expect(persistedSubtask).toBeUndefined(); // The subtask should NOT be found

      // Check that the issue key counter reflects only the created Bug issue
      expect(dbData.issueKeyCounter).toBe(1); // Assumes the counter started at 0 and incremented once for the Bug
  });

  // Test Case 4: Create Subtask with Parent of Invalid Type (e.g., Subtask) - Persistence Verification
   it('should return 400 and not persist the second Subtask issue when parent is another Subtask', async () => {
      // Arrange: Create a valid parent (e.g., Epic) and a first Subtask linked to it
      const epicReqBody = {
          fields: {
              issuetype: { name: 'Epic' },
              summary: 'Valid parent Epic',
          }
      };
      const epicResponse = await request(app).post('/rest/api/2/issues').send(epicReqBody);
      expect(epicResponse.status).toBe(201);
      const epicKey = epicResponse.body.key;
      expect(epicKey).toBeDefined();

      const firstSubtaskReqBody = {
          fields: {
              issuetype: { name: 'Subtask' },
              summary: 'First Subtask under Epic',
              parent: { key: epicKey },
          }
      };
      const firstSubtaskResponse = await request(app).post('/rest/api/2/issues').send(firstSubtaskReqBody);
      expect(firstSubtaskResponse.status).toBe(201);
      const firstSubtaskKey = firstSubtaskResponse.body.key;
      expect(firstSubtaskKey).toBeDefined();

      // Verify initial state: Epic and First Subtask exist, Epic has First Subtask as child
      let dbContentInitial = await fs.promises.readFile(dbPath, 'utf8');
      let dbDataInitial = JSON.parse(dbContentInitial);
      expect(dbDataInitial.issues.length).toBe(2);
      const persistedEpicInitial = dbDataInitial.issues.find((issue: AnyIssue) => issue.key === epicKey);
      expect(persistedEpicInitial).toBeDefined();
      // Ensure the cast is correct before accessing childIssueKeys
      if (persistedEpicInitial && persistedEpicInitial.issueType === 'Epic') {
          expect(persistedEpicInitial.childIssueKeys).toContain(firstSubtaskKey);
      } else {
           // This case indicates a test setup error
           throw new Error('Initial Epic not found or has wrong type in DB');
      }
      expect(dbDataInitial.issueKeyCounter).toBe(2); // Counter incremented twice

      // Construct the second Subtask request body, pointing to the first Subtask as parent
      const secondSubtaskReqBody = {
          fields: {
              issuetype: { name: 'Subtask' },
              summary: 'Second Subtask under First Subtask (Invalid Parent)',
              parent: { key: firstSubtaskKey }, // Invalid parent key (a Subtask)
          }
      };

      // Act
      const response = await request(app).post('/rest/api/2/issues').send(secondSubtaskReqBody);

      // Assert (API response)
      expect(response.status).toBe(400); // Expecting 400 for invalid parent type
      // FIX: Updated assertion to check for 'errorMessages' array instead of single 'error' field
      expect(response.body).toHaveProperty('errorMessages'); // Expecting an errorMessages array in the body
      expect(Array.isArray(response.body.errorMessages)).toBe(true); // Ensure it's an array
      // FIX: Updated assertion to check if the errorMessages array contains the specific message
      expect(response.body.errorMessages).toContain(`Issue with key '${firstSubtaskKey}' has type 'Subtask', which cannot be a parent of a Subtask. Only Epic or Story issues can be parents of Subtasks.`); // Specific error message check

      // Assert (Persistence)
      const dbContent = await fs.promises.readFile(dbPath, 'utf8');
      const dbData = JSON.parse(dbContent);

      // Check that the database state is unchanged from the initial state (before the failed creation attempt)
      expect(dbData.issues.length).toBe(2); // Still only the Epic and the first Subtask
      const persistedEpic = dbData.issues.find((issue: AnyIssue) => issue.key === epicKey);
      expect(persistedEpic).toBeDefined();
       // Ensure the cast is correct before accessing childIssueKeys
      if (persistedEpic && persistedEpic.issueType === 'Epic') {
          expect(persistedEpic.childIssueKeys).toContain(firstSubtaskKey);
          expect(persistedEpic.childIssueKeys.length).toBe(1); // Epic still only has the first Subtask as child
      } else {
           // This case indicates a test setup error
           throw new Error('Final Epic not found or has wrong type in DB');
      }


      const persistedFirstSubtask = dbData.issues.find((issue: AnyIssue) => issue.key === firstSubtaskKey);
      expect(persistedFirstSubtask).toBeDefined();
      expect(persistedFirstSubtask.issueType).toBe('Subtask');
      expect(persistedFirstSubtask.parentKey).toBe(epicKey); // First Subtask still points to Epic

      // Check that the second Subtask was NOT added
      const persistedSecondSubtask = dbData.issues.find((issue: AnyIssue) => issue.summary === 'Second Subtask under First Subtask (Invalid Parent)');
      expect(persistedSecondSubtask).toBeUndefined(); // The second subtask should NOT be found

      // Check that the issue key counter has not increased further
      expect(dbData.issueKeyCounter).toBe(2); // Counter should still be 2
  });


}); // End of describe Persistence Verification
