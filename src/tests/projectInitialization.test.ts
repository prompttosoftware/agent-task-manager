// src/tests/projectInitialization.test.ts
import { test, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

test('package.json exists and contains required fields', () => {
  const packageJsonPath = resolve(process.cwd(), 'package.json');
  expect(existsSync(packageJsonPath)).toBe(true);

  if (existsSync(packageJsonPath)) {
    const packageJsonContent = readFileSync(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);

    expect(packageJson).toHaveProperty('name');
    expect(packageJson).toHaveProperty('version');
    // Add more assertions as needed to check other required fields
  }
});
