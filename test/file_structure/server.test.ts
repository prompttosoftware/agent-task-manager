// test/file_structure/server.test.ts
import { expect, test } from 'vitest';
import * as fs from 'fs';
import { execSync } from 'child_process';

test('server.ts file exists', () => {
  const filePath = 'src/server.ts';
  expect(fs.existsSync(filePath)).toBe(true);
});

test('server.ts compiles without errors', () => {
  try {
    execSync('npx tsc src/server.ts --noEmit', { stdio: 'pipe' });
  } catch (error: any) {
    console.error(error.stdout?.toString() || error.stderr?.toString());
    expect(error).toBe(undefined);
  }
});