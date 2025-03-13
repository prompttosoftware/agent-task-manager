// src/tests/fileStructure.test.ts
import { existsSync } from 'fs';
import { resolve } from 'path';

const srcPath = resolve(__dirname, '../');

describe('File Structure', () => {
  it('should have src/controllers directory', () => {
    expect(existsSync(resolve(srcPath, 'controllers'))).toBe(true);
  });

  it('should have src/routes directory', () => {
    expect(existsSync(resolve(srcPath, 'routes'))).toBe(true);
  });

  it('should have src/services directory', () => {
    expect(existsSync(resolve(srcPath, 'services'))).toBe(true);
  });

  it('should have src/models directory', () => {
    expect(existsSync(resolve(srcPath, 'models'))).toBe(true);
  });

  it('should have src/config directory', () => {
    expect(existsSync(resolve(srcPath, 'config'))).toBe(true);
  });
});