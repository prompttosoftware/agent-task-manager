// src/models/status.spec.ts

import { Status } from './status';

describe('Status Model', () => {
  it('should check the properties of the Status interface', () => {
    const status: Status = {
      id: 1,
      name: 'Open',
      code: 'OPEN'
    };
    expect(status).toHaveProperty('id');
    expect(status).toHaveProperty('name');
    expect(status).toHaveProperty('code');
  });

  it('should have an id property of type number', () => {
    const status: Status = {
      id: 1,
      name: 'Open',
      code: 'OPEN'
    };
    expect(typeof status.id).toBe('number');
  });

  it('should have a name property of type string', () => {
    const status: Status = {
      id: 1,
      name: 'Open',
      code: 'OPEN'
    };
    expect(typeof status.name).toBe('string');
  });

  it('should have a code property of type string', () => {
    const status: Status = {
      id: 1,
      name: 'Open',
      code: 'OPEN'
    };
    expect(typeof status.code).toBe('string');
  });

  describe('Status Interface Validation', () => {
    it('should accept a valid Status object', () => {
      const status: Status = {
        id: 123,
        name: 'In Progress',
        code: 'IN_PROGRESS',
      };
      expect(status.id).toEqual(123);
      expect(status.name).toEqual('In Progress');
      expect(status.code).toEqual('IN_PROGRESS');
    });

    it('should work with different status data', () => {
        const status: Status = {
            id: 456,
            name: 'Completed',
            code: 'COMPLETED'
        };
        expect(status.id).toEqual(456);
        expect(status.name).toEqual('Completed');
        expect(status.code).toEqual('COMPLETED');
    });
  });
});