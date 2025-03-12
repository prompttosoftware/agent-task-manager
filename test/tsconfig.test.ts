// test/tsconfig.test.ts
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const tsconfigPath = path.resolve(process.cwd(), 'tsconfig.json');

describe('tsconfig.json', () => {
  it('should exist', () => {
    expect(fs.existsSync(tsconfigPath)).toBe(true);
  });

  it('should have correct compilerOptions', () => {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    expect(tsconfig.compilerOptions).toBeDefined();
    expect(tsconfig.compilerOptions.target).toBeDefined();
    expect(tsconfig.compilerOptions.module).toBeDefined();
    expect(tsconfig.compilerOptions.outDir).toBeDefined();
    expect(tsconfig.compilerOptions.esModuleInterop).toBeDefined();
  });

  it('should have include and exclude properties', () => {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    expect(tsconfig.include).toBeDefined();
    expect(tsconfig.exclude).toBeDefined();
  });
});
