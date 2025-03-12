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
    expect(tsconfig.compilerOptions.target).toBe('es2020');
    expect(tsconfig.compilerOptions.module).toBe('commonjs');
    expect(tsconfig.compilerOptions.outDir).toBe('dist');
    expect(tsconfig.compilerOptions.esModuleInterop).toBe(true);
  });

  it('should have include and exclude properties', () => {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    expect(tsconfig.include).toEqual(['src']);
    expect(tsconfig.exclude).toEqual(['node_modules']);
  });
});
