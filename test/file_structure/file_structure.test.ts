// test/file_structure/file_structure.test.ts
import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const projectRoot = '.'; // Assuming tests are run from the project root

describe('File Structure Verification', () => {
  it('should verify that the src directory is created', () => {
    const srcDir = path.join(projectRoot, 'src');
    expect(fs.existsSync(srcDir)).toBe(true);
  });

  it('should verify that the controllers directory is created inside src', () => {
    const controllersDir = path.join(projectRoot, 'src', 'controllers');
    expect(fs.existsSync(controllersDir)).toBe(true);
  });

  it('should verify that the services directory is created inside src', () => {
    const servicesDir = path.join(projectRoot, 'src', 'services');
    expect(fs.existsSync(servicesDir)).toBe(true);
  });

  it('should verify that the repositories directory is created inside src', () => {
    const repositoriesDir = path.join(projectRoot, 'src', 'repositories');
    expect(fs.existsSync(repositoriesDir)).toBe(true);
  });

  it('should verify that the models directory is created inside src', () => {
    const modelsDir = path.join(projectRoot, 'src', 'models');
    expect(fs.existsSync(modelsDir)).toBe(true);
  });

  it('should verify that the webhooks directory is created inside src', () => {
    const webhooksDir = path.join(projectRoot, 'src', 'webhooks');
    expect(fs.existsSync(webhooksDir)).toBe(true);
  });

  it('should verify that the config directory is created inside src', () => {
    const configDir = path.join(projectRoot, 'src', 'config');
    expect(fs.existsSync(configDir)).toBe(true);
  });

  it('should verify that the utils directory is created inside src', () => {
    const utilsDir = path.join(projectRoot, 'src', 'utils');
    expect(fs.existsSync(utilsDir)).toBe(true);
  });

  it('should verify that the middleware directory is created inside src', () => {
    const middlewareDir = path.join(projectRoot, 'src', 'middleware');
    expect(fs.existsSync(middlewareDir)).toBe(true);
  });

  it('should verify that the test directory is created', () => {
    const testDir = path.join(projectRoot, 'test');
    expect(fs.existsSync(testDir)).toBe(true);
  });

  it('should verify that the data directory is created', () => {
    const dataDir = path.join(projectRoot, 'data');
    expect(fs.existsSync(dataDir)).toBe(true);
  });

  it('should verify that the logs directory is created', () => {
    const logsDir = path.join(projectRoot, 'logs');
    expect(fs.existsSync(logsDir)).toBe(true);
  });

  it('should verify that the app.ts file exists', () => {
    const appFile = path.join(projectRoot, 'src', 'app.ts');
    expect(fs.existsSync(appFile)).toBe(true);
  });

  it('should verify that the server.ts file exists', () => {
    const serverFile = path.join(projectRoot, 'src', 'server.ts');
    expect(fs.existsSync(serverFile)).toBe(true);
  });

  it('should verify that the routes.ts file exists', () => {
    const routesFile = path.join(projectRoot, 'src', 'routes.ts');
    expect(fs.existsSync(routesFile)).toBe(true);
  });
});
