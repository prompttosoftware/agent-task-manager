import request from 'supertest';
import { Express } from 'express';
import { setupApp } from '../../app';

describe('Epic Controller', () => {
  let app: Express;

  beforeAll(async () => {
    app = await setupApp();
  });

  it('should create an epic', async () => {
    const response = await request(app)
      .post('/api/epics')
      .send({ name: 'Test Epic', description: 'This is a test epic' });

    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Test Epic');
  });

  it('should get an epic by id', async () => {
    const createResponse = await request(app)
      .post('/api/epics')
      .send({ name: 'Epic to get', description: 'Get epic test' });
    expect(createResponse.statusCode).toBe(201);
    const epicId = createResponse.body.id;

    const getResponse = await request(app).get(`/api/epics/${epicId}`);
    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.body.id).toBe(epicId);
    expect(getResponse.body.name).toBe('Epic to get');
  });

  it('should return 400 for invalid epic creation', async () => {
    const response = await request(app)
      .post('/api/epics')
      .send({ name: '', description: 'test' }); // Invalid name
    expect(response.statusCode).toBe(400);
  });

  it('should update an epic', async () => {
    const createResponse = await request(app)
      .post('/api/epics')
      .send({ name: 'Epic to update', description: 'Update epic test' });
    expect(createResponse.statusCode).toBe(201);
    const epicId = createResponse.body.id;

    const updateResponse = await request(app)
      .put(`/api/epics/${epicId}`)
      .send({ name: 'Updated Epic', description: 'Updated epic description' });
    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.body.name).toBe('Updated Epic');
  });

  it('should delete an epic', async () => {
    const createResponse = await request(app)
      .post('/api/epics')
      .send({ name: 'Epic to delete', description: 'Delete epic test' });
    expect(createResponse.statusCode).toBe(201);
    const epicId = createResponse.body.id;

    const deleteResponse = await request(app).delete(`/api/epics/${epicId}`);
    expect(deleteResponse.statusCode).toBe(204);

    const getResponse = await request(app).get(`/api/epics/${epicId}`);
    expect(getResponse.statusCode).toBe(404);
  });
});