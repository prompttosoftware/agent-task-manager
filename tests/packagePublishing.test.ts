// tests/packagePublishing.test.ts

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to execute shell commands
const exec = (command: string, options = {}) => {
  try {
    const result = execSync(command, {
      cwd: path.join(__dirname, '../'), // Assuming the test is run from the root
      stdio: 'pipe',
      ...options,
    });
    return result.toString();
  } catch (error: any) {
    console.error(`Command failed: ${command}`);
    console.error(error.stdout?.toString());
    console.error(error.stderr?.toString());
    throw error;
  }
};


describe('Package Publishing Verification', () => {
  const packageName = 'agent-task-manager'; // Replace with your package name
  const packageVersion = require('../package.json').version;  // Dynamically get the version from package.json

  it('should verify package name and version', () => {
    const output = exec(`npm view ${packageName} --json`);
    const packageInfo = JSON.parse(output);
    expect(packageInfo.name).toBe(packageName);
    expect(packageInfo.version).toBe(packageVersion);
  });

  it('should verify published files', () => {
    // Get a list of files in the dist directory.
    const distFiles = fs.readdirSync(path.join(__dirname, '../dist'));

    // Verify that these files are also in the published package.
    const output = exec(`npm view ${packageName} dist.files --json`);
    const publishedFiles = JSON.parse(output);
    
    // Filter out any files or directories that are not files
    const filteredDistFiles = distFiles.filter(file => {
      const filePath = path.join(__dirname, '../dist', file);
      return fs.statSync(filePath).isFile();
    });
    
    filteredDistFiles.forEach(distFile => {
      expect(publishedFiles).toContain(distFile);
    });

  });

  it('should verify dependencies are included', () => {
    const output = exec(`npm view ${packageName} dependencies --json`);
    const dependencies = JSON.parse(output);
    const packageJson = require('../package.json');
    if (packageJson.dependencies) {
        Object.keys(packageJson.dependencies).forEach(dep => {
            expect(dependencies).toHaveProperty(dep);
        });
    }
  });

  it('should verify the package can be installed and used in a simple project', () => {
    const testProjectDir = path.join(__dirname, 'test-project');
    // Create a test project directory
    if (!fs.existsSync(testProjectDir)) {
        fs.mkdirSync(testProjectDir);
    }

    // Initialize a new npm project
    exec('npm init -y', { cwd: testProjectDir });
    // Install the package
    exec(`npm install ${packageName}@latest`, { cwd: testProjectDir });

    // Create a simple test file
    const testFilePath = path.join(testProjectDir, 'index.js');
    fs.writeFileSync(testFilePath, `
const { someFunction } = require('${packageName}');
console.log(someFunction());
`, 'utf-8');

    // Execute the test file
    const output = exec('node index.js', { cwd: testProjectDir });

    // Add some expectation here if someFunction exists
    // exec(`rm -rf ${testProjectDir}`); // Clean up test project
  });
});