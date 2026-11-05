import request from 'supertest';
import { app } from '../src/app';

describe('Baseline System Health & API Envelope', () => {
  it('GET /api/health returns HTTP 200 with status UP', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('UP');
    expect(res.body.data.service).toBe('SingSlot API');
  });

  it('Unknown route returns 404 or unhandled response', async () => {
    const res = await request(app).get('/api/non-existent-route');
    expect(res.status).toBe(404);
  });
});
