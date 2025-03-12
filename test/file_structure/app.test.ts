// test/file_structure/app.test.ts
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const testDir = 'src';

describe('App Directory Structure', () => {
  it('should have app.ts', () => {
    expect(fs.existsSync(path.join(testDir, 'app.ts'))).toBe(true);
  });
});
