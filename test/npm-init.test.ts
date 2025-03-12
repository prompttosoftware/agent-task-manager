// test/npm-init.test.ts
import { test, expect, describe, afterAll } from 'vitest';
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const TEST_PROJECT_DIR = 'test-project';

// Helper function to execute shell commands
const executeCommand = (command: string, cwd?: string) => {
    try {
        return execSync(command, { stdio: 'pipe', cwd: cwd }).toString();
    } catch (error: any) {
        console.error(`Command failed: ${command}\n${error.stdout?.toString()}\n${error.stderr?.toString()}`);
        throw error;
    }
};


describe('npm init -y', () => {
    beforeAll(() => {
        // Ensure test project directory exists
        if (!fs.existsSync(TEST_PROJECT_DIR)) {
          fs.mkdirSync(TEST_PROJECT_DIR);
        }

        // Initialize a new npm project in the test directory
        executeCommand('npm init -y', TEST_PROJECT_DIR);
    });

    afterAll(() => {
        // Clean up the test project directory
        // This will fail on the first run if the directory is not created.
        try {
          const testProjectPath = path.resolve(TEST_PROJECT_DIR);
            // Remove the directory and its contents recursively
            executeCommand(`rm -rf ${testProjectPath}`);
        } catch (error) {
          console.warn("Failed to remove test directory, may need manual cleanup");
        }
    });

    test('package.json is created', () => {
        const packageJsonPath = path.join(TEST_PROJECT_DIR, 'package.json');
        expect(fs.existsSync(packageJsonPath)).toBe(true);
    });

    test('package.json contains the correct project name', () => {
        const packageJsonPath = path.join(TEST_PROJECT_DIR, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        // Assuming the project name is the directory name
        const expectedName = 'test-project';
        expect(packageJson.name).toBe(expectedName);
    });

    test('project version is set to 1.0.0', () => {
        const packageJsonPath = path.join(TEST_PROJECT_DIR, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        expect(packageJson.version).toBe('1.0.0');
    });

    test('dependencies and devDependencies are empty', () => {
        const packageJsonPath = path.join(TEST_PROJECT_DIR, 'package.json');
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        expect(packageJson.dependencies).toBe(undefined);
        expect(packageJson.devDependencies).toBe(undefined);
    });
});
