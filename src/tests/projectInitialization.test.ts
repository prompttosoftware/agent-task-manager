// src/tests/projectInitialization.test.ts
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, it, expect } from 'vitest';

const packageJsonPath = resolve(__dirname, '../package.json');

describe('Package.json Dependencies', () => {
  it('should include express, @types/express, body-parser, and uuid as dependencies', () => {
    const packageJsonContent = readFileSync(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);

    expect(packageJson.dependencies).toBeDefined();
    expect(packageJson.dependencies).toHaveProperty('express');
    expect(packageJson.dependencies).toHaveProperty('@types/express');
    expect(packageJson.dependencies).toHaveProperty('body-parser');
    expect(packageJson.dependencies).toHaveProperty('uuid');
  });
});