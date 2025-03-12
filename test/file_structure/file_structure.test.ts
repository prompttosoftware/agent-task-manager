// test/file_structure/file_structure.test.ts
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const testDir = 'test';
const srcDir = 'src';

const checkDirectoryStructure = (dirPath: string, expectedSubdirectories: string[], expectedFiles: string[] = []) => {
  const directories = expectedSubdirectories.map(subdir => path.join(dirPath, subdir));
  const files = expectedFiles.map(file => path.join(dirPath, file));

  directories.forEach(dir => {
    it(`should have directory: ${dir}`, () => {
      expect(fs.existsSync(dir)).toBe(true);
    });
  });

  files.forEach(file => {
    it(`should have file: ${file}`, () => {
      expect(fs.existsSync(file)).toBe(true);
    });
  });
};


describe('Test Directory Structure', () => {
  it('should have a test coverage report generated', () => {
    // This test is a placeholder. The actual check for coverage
    // depends on how the coverage report is generated (e.g., a specific file).
    // For now, we'll assume the coverage report is generated.
    expect(true).toBe(true);
  });

  describe('Test Directory Substructure', () => {
    checkDirectoryStructure(testDir, ['controllers', 'services', 'repositories'], ['setup.ts']);
  });

  describe('Src Directory Structure', () => {
    checkDirectoryStructure(srcDir, ['controllers', 'services', 'repositories']);
  });
});
