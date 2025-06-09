// src/index.test.ts
import { hello } from './index';

describe('index', () => {
  it('should return "Hello, world!"', () => {
    expect(hello()).toBe('Hello, world!');
  });
});
