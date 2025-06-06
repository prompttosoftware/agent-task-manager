import request from 'supertest';
import express from 'express'; // Import express types for app

// We will require app inside beforeEach after resetting modules

describe('Task API Tests', () => {
  let app: express.Express; // Variable to hold the app instance

  // Reset modules and require app before each test
  // This ensures a fresh Express app instance with an empty tasks array for each test
  beforeEach(() => {
    jest.resetModules(); // Reset Node's module cache
    // Dynamically require the app module after reset
    // The default export of app.ts is the express app instance
    app = require('../src/app').default;
  });

  describe('GET /tasks', () => {
    it('should return an empty array initially', async () => {
      const res = await request(app).get('/tasks');
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('POST /tasks', () => {
    const validTask = { title: 'Test Task', description: 'This is a test task' };

    it('should create a new task and return it with status 201', async () => {
      const res = await request(app)
        .post('/tasks')
        .send(validTask);

      expect(res.statusCode).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(typeof res.body.id).toBe('number');
      expect(res.body.title).toBe(validTask.title);
      expect(res.body.description).toBe(validTask.description);
      expect(res.body.completed).toBe(false);

      // Verify it exists by getting all tasks
      const getRes = await request(app).get('/tasks');
      expect(getRes.body.length).toBe(1);
      // Check if the created task is in the list returned by GET /tasks
      expect(getRes.body.find((task: { id: number }) => task.id === res.body.id)).toEqual(res.body);
    });

    it('should return 400 if title is missing', async () => {
      const invalidTask = { description: 'This task is missing a title' };
      const res = await request(app)
        .post('/tasks')
        .send(invalidTask);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'Title and description are required');
    });

    it('should return 400 if description is missing', async () => {
      const invalidTask = { title: 'Missing description' };
      const res = await request(app)
        .post('/tasks')
        .send(invalidTask);

      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('message', 'Title and description are required');
    });

    it('should return 400 if both title and description are missing', async () => {
        const invalidTask = {};
        const res = await request(app)
            .post('/tasks')
            .send(invalidTask);

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty('message', 'Title and description are required');
    });
  });

  describe('GET /tasks/:id', () => {
    it('should return a specific task by ID', async () => {
      // First, create a task
      const postRes = await request(app)
        .post('/tasks')
        .send({ title: 'Task to Find', description: 'Find me by ID' });

      const taskId = postRes.body.id;

      // Then, get the task by ID
      const getRes = await request(app).get(`/tasks/${taskId}`);

      expect(getRes.statusCode).toBe(200);
      expect(getRes.body).toEqual(postRes.body); // Should be the same task created
    });

    it('should return 404 if task is not found', async () => {
      // Try to get a task that doesn't exist (e.g., ID 999)
      const nonExistentTaskId = 999;
      const getRes = await request(app).get(`/tasks/${nonExistentTaskId}`);

      expect(getRes.statusCode).toBe(404);
      expect(getRes.body).toHaveProperty('message', 'Task not found');
    });

    it('should return 404 if ID is invalid (e.g., not a number)', async () => {
        const invalidId = 'abc';
        const getRes = await request(app).get(`/tasks/${invalidId}`);

        // The current app code will return 404 because parseInt('abc', 10) is NaN,
        // and NaN will not match any task ID.
        expect(getRes.statusCode).toBe(404);
        expect(getRes.body).toHaveProperty('message', 'Task not found');
    });
  });

  describe('PUT /tasks/:id', () => {
    it('should update a task by ID and return the updated task', async () => {
      // First, create a task
      const postRes = await request(app)
        .post('/tasks')
        .send({ title: 'Task to Update', description: 'Original description', completed: false });

      const taskId = postRes.body.id;
      const updatedData = { description: 'Updated description', completed: true };

      // Then, update the task
      const putRes = await request(app)
        .put(`/tasks/${taskId}`)
        .send(updatedData);

      expect(putRes.statusCode).toBe(200);
      expect(putRes.body).toHaveProperty('id', taskId);
      expect(putRes.body).toHaveProperty('title', postRes.body.title); // Title should remain the same if not updated
      expect(putRes.body).toHaveProperty('description', updatedData.description); // Description should be updated
      expect(putRes.body).toHaveProperty('completed', updatedData.completed); // Completed should be updated

      // Verify the update by getting the task again
      const getRes = await request(app).get(`/tasks/${taskId}`);
      expect(getRes.statusCode).toBe(200);
      expect(getRes.body).toEqual(putRes.body);
    });

    it('should allow updating only specific fields (e.g., only completed)', async () => {
        // First, create a task
        const postRes = await request(app)
          .post('/tasks')
          .send({ title: 'Partial Update', description: 'Original desc', completed: false });

        const taskId = postRes.body.id;
        const updatedData = { completed: true }; // Only update completed

        // Then, update the task
        const putRes = await request(app)
          .put(`/tasks/${taskId}`)
          .send(updatedData);

        expect(putRes.statusCode).toBe(200);
        expect(putRes.body).toHaveProperty('id', taskId);
        expect(putRes.body).toHaveProperty('title', postRes.body.title); // Should be unchanged
        expect(putRes.body).toHaveProperty('description', postRes.body.description); // Should be unchanged
        expect(putRes.body).toHaveProperty('completed', true); // Should be updated
    });

    it('should return 404 if task is not found', async () => {
      const nonExistentTaskId = 999;
      const updatedData = { title: 'Non-existent' };
      const putRes = await request(app)
        .put(`/tasks/${nonExistentTaskId}`)
        .send(updatedData);

      expect(putRes.statusCode).toBe(404);
      expect(putRes.body).toHaveProperty('message', 'Task not found');
    });

     it('should return 404 if ID is invalid (e.g., not a number)', async () => {
        const invalidId = 'abc';
        const updatedData = { title: 'Update' };
        const putRes = await request(app).put(`/tasks/${invalidId}`).send(updatedData);

        // The current app code will return 404 because parseInt('abc', 10) is NaN,
        // and NaN will not match any task ID.
        expect(putRes.statusCode).toBe(404);
        expect(putRes.body).toHaveProperty('message', 'Task not found');
    });
  });

  describe('DELETE /tasks/:id', () => {
    it('should delete a task by ID and return 204', async () => {
      // First, create a task
      const postRes = await request(app)
        .post('/tasks')
        .send({ title: 'Task to Delete', description: 'Delete me' });

      const taskId = postRes.body.id;

      // Then, delete the task
      const deleteRes = await request(app).delete(`/tasks/${taskId}`);

      expect(deleteRes.statusCode).toBe(204);
      // Supertest's .body is often undefined for 204 responses, check explicitly
      expect(deleteRes.text).toBe(''); // Check empty text body for 204

      // Verify deletion by trying to get the task
      const getRes = await request(app).get(`/tasks/${taskId}`);
      expect(getRes.statusCode).toBe(404);
    });

    it('should return 404 if task is not found', async () => {
      const nonExistentTaskId = 999; // Non-existent ID
      const deleteRes = await request(app).delete(`/tasks/${nonExistentTaskId}`);

      expect(deleteRes.statusCode).toBe(404);
      expect(deleteRes.body).toHaveProperty('message', 'Task not found');
    });

     it('should return 404 if ID is invalid (e.g., not a number)', async () => {
        const invalidId = 'abc';
        const deleteRes = await request(app).delete(`/tasks/${invalidId}`);

        // The current app code will return 404 because parseInt('abc', 10) is NaN,
        // and NaN will not match any task ID.
        expect(deleteRes.statusCode).toBe(404);
        expect(deleteRes.body).toHaveProperty('message', 'Task not found');
    });
  });
});
