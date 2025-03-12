// test/file_structure/app.test.ts
import { expect, test } from 'vitest';
import * as fs from 'fs';
import { execSync } from 'child_process';

test('app.ts file exists', () => {
  const filePath = 'src/app.ts';
  expect(fs.existsSync(filePath)).toBe(true);
});

test('app.ts compiles without errors', () => {
  try {
    execSync('npx tsc src/app.ts --noEmit', { stdio: 'pipe' });
  } catch (error: any) {
    console.error(error.stdout?.toString() || error.stderr?.toString());
    expect(error).toBe(undefined);
  }
});