// test/eslint-prettier.test.ts
import { test, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const projectRoot = process.cwd();

test('should have ESLint configuration file', () => {
  const eslintConfigPaths = [
    path.join(projectRoot, '.eslintrc.js'),
    path.join(projectRoot, '.eslintrc.json'),
    path.join(projectRoot, '.eslintrc.yml'),
    path.join(projectRoot, '.eslintrc.yaml'),
  ];

  let eslintConfigExists = false;
  for (const configPath of eslintConfigPaths) {
    if (fs.existsSync(configPath)) {
      eslintConfigExists = true;
      break;
    }
  }
  expect(eslintConfigExists).toBe(true);
});

test('should have Prettier configuration file', () => {
  const prettierConfigPaths = [
    path.join(projectRoot, '.prettierrc.js'),
    path.join(projectRoot, '.prettierrc.json'),
    path.join(projectRoot, '.prettierrc.yml'),
    path.join(projectRoot, '.prettierrc.yaml'),
    path.join(projectRoot, '.prettierrc'),
  ];

  let prettierConfigExists = false;
  for (const configPath of prettierConfigPaths) {
    if (fs.existsSync(configPath)) {
      prettierConfigExists = true;
      break;
    }
  }
  expect(prettierConfigExists).toBe(true);
});

// TODO: Implement linting and formatting tests.  These will require executing CLI commands, which is beyond the scope of a simple file check.
