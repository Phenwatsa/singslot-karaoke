import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app';
import { prisma } from '../src/prisma';
import { getJwtSecret } from '../src/config/jwt';

describe('Feature F-01: Seeded User Authentication & RBAC Suite', () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  /**
   * Security & Configuration: Fail-fast verification on missing environment variables.
   */
  it('security: getJwtSecret fails fast when JWT_SECRET is unset or empty', () => {
    const originalSecret = process.env.JWT_SECRET;
    try {
      delete process.env.JWT_SECRET;
      expect(() => getJwtSecret()).toThrow('FATAL: JWT_SECRET environment variable is missing or empty.');
      process.env.JWT_SECRET = '   ';
      expect(() => getJwtSecret()).toThrow('FATAL: JWT_SECRET environment variable is missing or empty.');
    } finally {
      if (originalSecret === undefined) {
        delete process.env.JWT_SECRET;
      } else {
        process.env.JWT_SECRET = originalSecret;
      }
    }
  });

  /**
   * TEST-01 (AC-01): Valid credentials return HTTP 200 with signed JWT token and user role.
   */
  it('TEST-01: staff login returns HTTP 200 with signed JWT token and role STAFF', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'staff@singslot.local',
        password: 'Pass1234!'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('staff@singslot.local');
    expect(res.body.user.role).toBe('STAFF');
    expect(res.body.user.fullName).toBe('Cashier Staff');

    // Decode and verify JWT payload claims and 8-hour lifetime
    const secret = getJwtSecret();
    const decoded = jwt.verify(res.body.token, secret) as any;
    expect(decoded.sub).toBe(res.body.user.id);
    expect(decoded.email).toBe('staff@singslot.local');
    expect(decoded.role).toBe('STAFF');

    // Verify 8-hour expiration window (8 hours = 28,800 seconds)
    const tokenLifetimeSeconds = decoded.exp - decoded.iat;
    expect(tokenLifetimeSeconds).toBe(8 * 60 * 60);
  });

  /**
   * TEST-01a (AC-01a): Invalid credentials return HTTP 401 with code INVALID_CREDENTIALS.
   */
  it('TEST-01a: invalid password returns HTTP 401 with INVALID_CREDENTIALS', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'staff@singslot.local',
        password: 'WrongPassword!'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('TEST-01a: unknown email returns HTTP 401 with INVALID_CREDENTIALS', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@singslot.local',
        password: 'Pass1234!'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  /**
   * TEST-01b (AC-01b): Protected endpoints reject unauthenticated requests with HTTP 401 UNAUTHENTICATED.
   */
  it('TEST-01b: unauthenticated request to /api/auth/me returns HTTP 401 UNAUTHENTICATED', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('TEST-01b: malformed Bearer token returns HTTP 401 UNAUTHENTICATED', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid-garbage-token');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  /**
   * TEST-01c (AC-01c): Protected staff endpoints reject Customer tokens with HTTP 403 FORBIDDEN.
   */
  it('TEST-01c: customer accessing staff endpoint (/api/bookings/master) returns HTTP 403 FORBIDDEN', async () => {
    // 1. Login as customer
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'customer1@singslot.local',
        password: 'Pass1234!'
      });

    expect(loginRes.status).toBe(200);
    const customerToken = loginRes.body.token;

    // 2. Customer calls staff-only master schedule endpoint
    const res = await request(app)
      .get('/api/bookings/master')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  /**
   * TEST-01d (NFR-01, AC-01d): Password hashed with bcrypt (salt rounds >= 10);
   * GET /api/auth/me returns caller object without password hash.
   */
  it('TEST-01d: database stores passwords hashed with bcrypt and GET /api/auth/me excludes passwordHash', async () => {
    // 1. Inspect seeded database row directly
    const staffDbUser = await prisma.user.findUnique({
      where: { email: 'staff@singslot.local' }
    });
    expect(staffDbUser).not.toBeNull();
    expect(staffDbUser?.passwordHash).toBeDefined();
    // Verify bcrypt format ($2a$ or $2b$) and round 10 prefix
    expect(staffDbUser?.passwordHash).toMatch(/^\$2[ab]\$10\$/);
    expect(staffDbUser?.passwordHash).not.toBe('Pass1234!');

    // 2. Login to obtain token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'staff@singslot.local',
        password: 'Pass1234!'
      });
    const token = loginRes.body.token;
    expect(loginRes.body.user.passwordHash).toBeUndefined();

    // 3. Call GET /api/auth/me
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.success).toBe(true);
    expect(meRes.body.user).toBeDefined();
    expect(meRes.body.user.email).toBe('staff@singslot.local');
    expect(meRes.body.user.role).toBe('STAFF');
    // Ensure password hash is NEVER exposed (NFR-01)
    expect(meRes.body.user.passwordHash).toBeUndefined();
  });

  /**
   * TEST-01e (AC-01e): POST /api/auth/logout returns HTTP 200.
   */
  it('TEST-01e: valid logout request returns HTTP 200', async () => {
    // Login as customer
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'customer1@singslot.local',
        password: 'Pass1234!'
      });

    const token = loginRes.body.token;

    // Call logout endpoint
    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);
    expect(logoutRes.body.message).toBe('Logged out successfully');
  });
});
