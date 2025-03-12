// test/dependencies.test.ts
import { test, expect } from 'vitest';
import { execSync } from 'child_process';

const dependencies = [
  'express',
  'typescript',
  '@types/express',
  '@types/node',
  'nodemon',
  'vitest',
  '@vitest/coverage-c8',
  'eslint',
  '@typescript-eslint/parser',
  '@typescript-eslint/eslint-plugin',
  'prettier'
];

function isInstalled(dependency: string): boolean {
  try {
    execSync(`npm list ${dependency} --silent`);
    return true;
  } catch (error) {
    return false;
  }
}

test('Verify dependencies are installed', () => {
  dependencies.forEach(dependency => {
    expect(isInstalled(dependency)).toBe(true, `${dependency} is not installed`);
  });
});

// Verify package-lock.json has the correct versions (This part is not automated due to its complexity, needs manual check)
