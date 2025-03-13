// src/tests/projectInitialization.test.ts
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { expect, it, describe } from 'vitest';

describe('package.json verification', () => {
  it('should exist', () => {
    const packageJsonPath = resolve(__dirname, '../package.json');
    expect(existsSync(packageJsonPath)).toBe(true);
  });

  it('should contain the correct scripts', () => {
    const packageJsonPath = resolve(__dirname, '../package.json');
    const packageJsonContent = readFileSync(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);

    expect(packageJson.scripts).toBeDefined();
    expect(packageJson.scripts.start).toBe('node dist/index.js');
    expect(packageJson.scripts.dev).toBe('ts-node-dev src/index.ts');
  });

  it('should contain the necessary dependencies', () => {
    const packageJsonPath = resolve(__dirname, '../package.json');
    const packageJsonContent = readFileSync(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(packageJsonContent);

    expect(packageJson.dependencies).toBeDefined();
    expect(packageJson.devDependencies).toBeDefined();
    expect(Object.keys(packageJson.dependencies).some(dep => dep === 'express')).toBe(true);
    expect(Object.keys(packageJson.devDependencies).some(dep => dep === 'typescript')).toBe(true);
  });
});
