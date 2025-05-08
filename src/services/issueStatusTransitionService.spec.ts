import { IssueStatusTransitionService } from './issueStatusTransitionService';
import { databaseService } from './database';
import { getDBConnection } from '../config/db';
import { initializeDatabaseSchema } from '../config/databaseSchema';

describe('IssueStatusTransitionService', () => {
  let service: IssueStatusTransitionService;

  beforeAll(async () => {
    const db = await getDBConnection();
    await databaseService.connect(db);
    await initializeDatabaseSchema(databaseService);
  })

  beforeEach(() => {
    service = new IssueStatusTransitionService(databaseService);
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
    const beforeStatus = service.getStatusId('To Do');
    const afterStatus = service.getStatusId('In Progress');
    expect(service.isValidTransition(typeof(beforeStatus) === 'number' ? beforeStatus : 11, typeof(afterStatus) === 'number' ? afterStatus : 21)).toBe(true);
  });

  it('should allow transition from To Do (11) to Done (31)', () => {
    const beforeStatus = service.getStatusId('To Do');
    const afterStatus = service.getStatusId('Done');
    expect(service.isValidTransition(typeof(beforeStatus) === 'number' ? beforeStatus : 11, typeof(afterStatus) === 'number' ? afterStatus : 31)).toBe(true);
  });

  it('should allow transition from In Progress (21) to To Do (11)', () => {
    const beforeStatus = service.getStatusId('In Progress');
    const afterStatus = service.getStatusId('To Do');
    expect(service.isValidTransition(typeof(beforeStatus) === 'number' ? beforeStatus : 21, typeof(afterStatus) === 'number' ? afterStatus : 11)).toBe(true);
  });

  it('should allow transition from In Progress (21) to Done (31)', () => {
    const beforeStatus = service.getStatusId('In Progress');
    const afterStatus = service.getStatusId('Done');
    expect(service.isValidTransition(typeof(beforeStatus) === 'number' ? beforeStatus : 21, typeof(afterStatus) === 'number' ? afterStatus : 31)).toBe(true);
  });

  it('should not allow transition from In Progress (21) to In Progress (21)', () => {
    const beforeStatus = service.getStatusId('In Progress');
    const afterStatus = service.getStatusId('In Progress');
    expect(service.isValidTransition(typeof(beforeStatus) === 'number' ? beforeStatus : 21, typeof(afterStatus) === 'number' ? afterStatus : 21)).toBe(false);
  });

  it('should allow transition from Done (31) to To Do (11)', () => {
    const beforeStatus = service.getStatusId('Done');
    const afterStatus = service.getStatusId('To Do');
    expect(service.isValidTransition(typeof(beforeStatus) === 'number' ? beforeStatus : 31, typeof(afterStatus) === 'number' ? afterStatus : 11)).toBe(true);
  });

  it('should allow transition from Done (31) to In Progress (21)', () => {
    const beforeStatus = service.getStatusId('Done');
    const afterStatus = service.getStatusId('In Progress');
    expect(service.isValidTransition(typeof(beforeStatus) === 'number' ? beforeStatus : 31, typeof(afterStatus) === 'number' ? afterStatus : 21)).toBe(true);
  });

  it('should not allow transition from Done (31) to Done (31)', () => {
    const beforeStatus = service.getStatusId('Done');
    const afterStatus = service.getStatusId('Done');
    expect(service.isValidTransition(typeof(beforeStatus) === 'number' ? beforeStatus : 31, typeof(afterStatus) === 'number' ? afterStatus : 31)).toBe(false);
  });

  it('should not allow transitions from unknown current status', () => {
    const inProgressStatus = service.getStatusId('In Progress');
    const toDoStatus = service.getStatusId('To Do');
    expect(service.isValidTransition(10, typeof(inProgressStatus) === 'number' ? inProgressStatus : 21)).toBe(false); // Unknown current status 10
    expect(service.isValidTransition(99, typeof(toDoStatus) === 'number' ? toDoStatus : 11)).toBe(false); // Unknown current status 99
  });

  it('should not allow transitions to unknown target status (based on current logic)', () => {
    // Note: Current logic only defines valid *target* statuses per *current* status.
    // An unknown target status implicitly fails the checks within the switch cases.
    const inProgressStatus = service.getStatusId('In Progress');
    const toDoStatus = service.getStatusId('To Do');
    const doneStatus = service.getStatusId('Done');
    expect(service.isValidTransition(typeof(toDoStatus) === 'number' ? toDoStatus : 11, 99)).toBe(false); // To Do -> Unknown
    expect(service.isValidTransition(typeof(inProgressStatus) === 'number' ? inProgressStatus : 21, 99)).toBe(false); // In Progress -> Unknown
    expect(service.isValidTransition(typeof(doneStatus) === 'number' ? doneStatus : 31, 99)).toBe(false); // Done -> Unknown
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