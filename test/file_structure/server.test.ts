// test/file_structure/server.test.ts
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const testDir = 'src';

describe('Server Directory Structure', () => {
  it('should have server.ts', () => {
    expect(fs.existsSync(path.join(testDir, 'server.ts'))).toBe(true);
  });
});
