import { describe, expect, it } from '@jest/globals';
import { app } from './app';

describe('App', () => {
  it('should pass a basic test', () => {
    expect(true).toBe(true);
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });
});
