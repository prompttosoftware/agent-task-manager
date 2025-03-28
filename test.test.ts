import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { describe, it, expect } from 'vitest';

describe('Simple Test', () => {
  it('should import supertest and uuid', () => {
    expect(request).toBeDefined();
    expect(uuidv4).toBeDefined();
  });
});