// test/nodemon.test.ts
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { readFileSync } from 'fs';
import { describe, it, expect } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('nodemon configuration', () => {
  it('should have a dev script in package.json', () => {
    const packageJsonPath = resolve(__dirname, '../package.json');
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
    expect(packageJson.scripts).toHaveProperty('dev');
    expect(packageJson.scripts.dev).toContain('tsc --watch');
  });
});