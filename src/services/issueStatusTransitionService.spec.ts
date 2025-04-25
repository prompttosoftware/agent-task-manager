import { IssueStatusTransitionService } from './issueStatusTransitionService';
import { DatabaseService } from './databaseService'; // Import the real service/interface
import { IDatabaseConnection } from '../config/db'; // Import the connection interface type
import { createMockDbConnection } from '../mocks/dbconnection.mock'; // Import the mock

// Modify the mock class to extend the real DatabaseService.
// This allows the mock to inherit the private 'db' property structure.
// Remove the explicit 'db' property declaration from the mock.
class MockDatabaseService extends DatabaseService {
    // No explicit 'db' property here - it's inherited (private) from DatabaseService.

    constructor() {
        super(); // Call the parent constructor
        // The parent constructor initializes the private 'db' to null.
    }

    // Override all necessary methods with no-op or mock implementations.
    // Using the 'override' keyword for clarity and type safety.

    override async connect(): Promise<void> {
        // No-op implementation for the mock
        console.log('Mock CONNECT called'); // Optional logging
        return Promise.resolve();
    }

    override async disconnect(): Promise<void> {
        // No-op implementation for the mock
        console.log('Mock DISCONNECT called'); // Optional logging
        // Cannot directly access `this.db = null` as it's private in the parent,
        // but the override prevents the real disconnect logic.
        return Promise.resolve();
    }

    override async run(sql: string, params?: any[]): Promise<void> {
        // No-op implementation
        console.log(`Mock RUN: ${sql}`, params); // Optional logging for debug
        return Promise.resolve();
    }

    override async get<T>(sql: string, params?: any[]): Promise<T | undefined> {
        // No-op implementation returning undefined
        console.log(`Mock GET: ${sql}`, params); // Optional logging for debug
        return Promise.resolve(undefined);
    }

    override async all<T>(sql: string, params?: any[]): Promise<T[]> {
        // No-op implementation returning an empty array
        console.log(`Mock ALL: ${sql}`, params); // Optional logging for debug
        return Promise.resolve([]);
    }

    override async ensureTableExists(tableName: string, columns: { column: string; type: string }[]): Promise<void> {
        // No-op implementation
        console.log(`Mock ensureTableExists: ${tableName}`, columns); // Optional logging
        return Promise.resolve();
    }

    override async getSingleValue<T>(tableName: string, key: string): Promise<T | undefined> {
        // No-op implementation returning undefined
        console.log(`Mock getSingleValue: ${tableName}, ${key}`); // Optional logging
        return Promise.resolve(undefined);
    }

    override async setSingleValue<T>(tableName: string, key: string, value: T): Promise<void> {
        // No-op implementation
        console.log(`Mock setSingleValue: ${tableName}, ${key}`, value); // Optional logging
        return Promise.resolve();
    }

    override async beginTransaction(): Promise<void> {
        // No-op implementation
        console.log('Mock beginTransaction'); // Optional logging
        return Promise.resolve();
    }

    override async commitTransaction(): Promise<void> {
        // No-op implementation
        console.log('Mock commitTransaction'); // Optional logging
        return Promise.resolve();
    }

    override async rollbackTransaction(): Promise<void> {
        // No-op implementation
        console.log('Mock rollbackTransaction'); // Optional logging
        return Promise.resolve();
    }
}

// Instantiate the mock service
const mockDatabaseService = new MockDatabaseService();


describe('IssueStatusTransitionService', () => {
  let service: IssueStatusTransitionService;

  beforeEach(() => {
    service = new IssueStatusTransitionService(mockDatabaseService);
    // No need to mock specific database calls here as the current
    // implementation of isValidTransition is hardcoded and doesn't
    // use the databaseService parameter yet.
    // If tests were added that required specific return values from
    // the databaseService methods, we would adjust the mock here, e.g.:
    // jest.spyOn(mockDatabaseService, 'get').mockResolvedValue({ some_data: 'value' });
  });

  afterEach(() => {
    // Reset any mocks if necessary (though not strictly needed with the current no-op mock)
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Ensure mockDatabaseService is passed as the third argument in all relevant tests
  it('should allow transition from To Do (11) to In Progress (21)', () => {
    expect(service.isValidTransition(service.getStatusId('To Do')!, service.getStatusId('In Progress')!)).toBe(true);
  });

  it('should not allow transition from To Do (11) to Done (31)', () => {
    expect(service.isValidTransition(service.getStatusId('To Do')!, service.getStatusId('Done')!)).toBe(false);
  });

  it('should allow transition from In Progress (21) to To Do (11)', () => {
    expect(service.isValidTransition(service.getStatusId('In Progress')!, service.getStatusId('To Do')!)).toBe(true);
  });

  it('should allow transition from In Progress (21) to Done (31)', () => {
    expect(service.isValidTransition(service.getStatusId('In Progress')!, service.getStatusId('Done')!)).toBe(true);
  });

  it('should not allow transition from In Progress (21) to In Progress (21)', () => {
    expect(service.isValidTransition(service.getStatusId('In Progress')!, service.getStatusId('In Progress')!)).toBe(false);
  });

  it('should allow transition from Done (31) to To Do (11)', () => {
    expect(service.isValidTransition(service.getStatusId('Done')!, service.getStatusId('To Do')!)).toBe(true);
  });

  it('should allow transition from Done (31) to In Progress (21)', () => {
    expect(service.isValidTransition(service.getStatusId('Done')!, service.getStatusId('In Progress')!)).toBe(true);
  });

  it('should not allow transition from Done (31) to Done (31)', () => {
    expect(service.isValidTransition(service.getStatusId('Done')!, service.getStatusId('Done')!)).toBe(false);
  });

  it('should not allow transitions from unknown current status', () => {
    expect(service.isValidTransition(10, service.getStatusId('In Progress')!)).toBe(false); // Unknown current status 10
    expect(service.isValidTransition(99, service.getStatusId('To Do')!)).toBe(false); // Unknown current status 99
  });

  it('should not allow transitions to unknown target status (based on current logic)', () => {
    // Note: Current logic only defines valid *target* statuses per *current* status.
    // An unknown target status implicitly fails the checks within the switch cases.
    expect(service.isValidTransition(service.getStatusId('To Do')!, 99)).toBe(false); // To Do -> Unknown
    expect(service.isValidTransition(service.getStatusId('In Progress')!, 99)).toBe(false); // In Progress -> Unknown
    expect(service.isValidTransition(service.getStatusId('Done')!, 99)).toBe(false); // Done -> Unknown
  });

  it('should return correct status ID for known status names (case-insensitive)', () => {
    expect(service.getStatusId('To Do')).toBe(11);
    expect(service.getStatusId('to do')).toBe(11);
    expect(service.getStatusId('In Progress')).toBe(21);
    expect(service.getStatusId('in progress')).toBe(21);
    expect(service.getStatusId('Done')).toBe(31);
    expect(service.getStatusId('done')).toBe(31);
  });

  it('should return undefined for unknown status names', () => {
    expect(service.getStatusId('Unknown')).toBeUndefined();
    expect(service.getStatusId('')).toBeUndefined();
    expect(service.getStatusId(null as any)).toBeUndefined(); // Test null input
    expect(service.getStatusId(undefined as any)).toBeUndefined(); // Test undefined input
  });

  it('should return correct status name for known status IDs', () => {
    expect(service.getStatusName(11)).toBe('To Do');
    expect(service.getStatusName(21)).toBe('In Progress');
    expect(service.getStatusName(31)).toBe('Done');
  });

  it('should return undefined for unknown status IDs', () => {
    expect(service.getStatusName(99)).toBeUndefined();
    expect(service.getStatusName(0)).toBeUndefined();
    expect(service.getStatusName(-1)).toBeUndefined();
  });

  // Example of testing a future database-driven implementation (currently commented out)
  // describe('when transitions are loaded from database', () => {
  //   beforeEach(async () => {
  //     // Example: Mock the 'all' method to return specific transition rules
  //     const mockTransitions = [
  //       { current_status_id: 11, target_status_id: 21 }, // To Do -> In Progress
  //       { current_status_id: 21, target_status_id: 31 }, // In Progress -> Done
  //     ];
        // Use jest.spyOn to mock the method on the class instance
  //     jest.spyOn(mockDatabaseService, 'all').mockResolvedValue(mockTransitions);

  //     // Assume a method `loadTransitions` exists and is called, or modify isValidTransition
  //     // to directly query the DB service. For simplicity, let's assume isValidTransition queries directly.
  //     // service.loadTransitions(mockDatabaseService); // If such a method existed
  //   });

  //   it('should allow transition based on mocked DB data (e.g., 11 -> 21)', async () => {
        // // Modify isValidTransition to actually use the databaseService parameter
        // // Example modification (inside isValidTransition):
        // // const allowedTransitions = await databaseService.all(
        // //   'SELECT target_status_id FROM allowed_status_transitions WHERE current_status_id = ?',
        // //   [currentStatusId]
        // // );
        // // return allowedTransitions.some(t => t.target_status_id === targetStatusId);

  //      // For now, this test would fail as isValidTransition is hardcoded.
  //      // expect(await service.isValidTransition(11, 21, mockDatabaseService)).toBe(true);
  //   });

  //   it('should disallow transition not in mocked DB data (e.g., 11 -> 31)', async () => {
  //      // Similar to above, requires isValidTransition to use the DB service.
  //      // expect(await service.isValidTransition(11, 31, mockDatabaseService)).toBe(false);
  //   });
  // });
});