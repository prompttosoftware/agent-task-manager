import { IssueStatusTransitionService } from './issueStatusTransitionService';

describe('IssueStatusTransitionService', () => {
  let service: IssueStatusTransitionService;

  beforeEach(() => {
    service = new IssueStatusTransitionService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should allow transition from To Do (11) to In Progress (21)', () => {
    expect(service.isValidTransition(11, 21)).toBe(true);
  });

  it('should not allow transition from To Do (11) to Done (31)', () => {
    expect(service.isValidTransition(11, 31)).toBe(false);
  });

  it('should allow transition from In Progress (21) to To Do (11)', () => {
    expect(service.isValidTransition(21, 11)).toBe(true);
  });

  it('should allow transition from In Progress (21) to Done (31)', () => {
    expect(service.isValidTransition(21, 31)).toBe(true);
  });

  it('should not allow transition from In Progress (21) to In Progress (21)', () => {
    expect(service.isValidTransition(21, 21)).toBe(false);
  });

  it('should allow transition from Done (31) to To Do (11)', () => {
    expect(service.isValidTransition(31, 11)).toBe(true);
  });

  it('should allow transition from Done (31) to In Progress (21)', () => {
    expect(service.isValidTransition(31, 21)).toBe(true);
  });

  it('should not allow transition from Done (31) to Done (31)', () => {
    expect(service.isValidTransition(31, 31)).toBe(false);
  });

  it('should not allow any other transitions', () => {
    expect(service.isValidTransition(10, 21)).toBe(false);
    expect(service.isValidTransition(21, 32)).toBe(false);
    expect(service.isValidTransition(31, 10)).toBe(false);
  });
});