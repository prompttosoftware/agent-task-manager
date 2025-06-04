import request from 'supertest';
import app from '../../app';

describe('POST /rest/api/2/issue', () => {
  it('should return 200 with a success message', async () => {
    const response = await request(app)
      .post('/rest/api/2/issue')
      .send({});

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe('Issue created successfully!');
  });
});
