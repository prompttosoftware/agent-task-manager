import request from 'supertest';
import app from './app';
import config from './config';
import logger from './utils/logger';

describe('Health Check Endpoint', () => {
  it('should respond with 200 and a health message', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toBe('Hello, Agent Task Manager!');
  });

  it('should log request details', async () => {
    const consoleLogSpy = jest.spyOn(logger, 'info'); // Corrected spy usage
    await request(app).get('/');

    expect(consoleLogSpy).toHaveBeenCalled();
    const logCall = consoleLogSpy.mock.calls[0][0];
    expect(logCall).toMatchObject({
      method: 'GET',
      url: '/',
      statusCode: 200,
    });

    consoleLogSpy.mockRestore();
  });
});
