import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/app';
import { prisma } from '../src/prisma';

describe('Sprint 3 Slice F-11: Customer Self-Registration (TEST-12, AC-12, FR-12, NFR-01)', () => {
  const createdEmails: string[] = [];
  const uniqueSuffix = Date.now();
  const validEmail = `newcustomer.${uniqueSuffix}@singslot.local`;
  const forgedEmail = `forged.${uniqueSuffix}@singslot.local`;

  beforeAll(async () => {
    createdEmails.push(validEmail, forgedEmail);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { in: createdEmails } }
    });
    await prisma.$disconnect();
  });

  it('TEST-12: registers a new customer (201), hashes password with bcrypt, and allows immediate login', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: `  ${validEmail.toUpperCase()}  `,
        password: 'StrongPass123!',
        fullName: 'New Customer',
        phone: '0899998888'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(validEmail);
    expect(res.body.user.fullName).toBe('New Customer');
    expect(res.body.user.phone).toBe('0899998888');
    expect(res.body.user.role).toBe('CUSTOMER');
    expect(res.body.user.passwordHash).toBeUndefined();

    // Verify bcrypt hash in PostgreSQL (NFR-01)
    const dbUser = await prisma.user.findUnique({ where: { email: validEmail } });
    expect(dbUser).not.toBeNull();
    expect(dbUser!.passwordHash).toMatch(/^\$2[ab]\$10\$/);
    expect(dbUser!.passwordHash).not.toBe('StrongPass123!');

    // Verify immediate login succeeds
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: validEmail, password: 'StrongPass123!' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();
    expect(loginRes.body.user.role).toBe('CUSTOMER');
  });

  it('TEST-12: rejects duplicate email with 409 EMAIL_ALREADY_EXISTS', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'customer1@singslot.local',
        password: 'StrongPass123!',
        fullName: 'Duplicate User'
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  it('TEST-12: rejects invalid email, short password (< 8 chars), or empty fullName with 400 INVALID_INPUT', async () => {
    const badEmail = await request(app).post('/api/auth/register').send({
      email: 'not-an-email',
      password: 'StrongPass123!',
      fullName: 'Test User'
    });
    expect(badEmail.status).toBe(400);
    expect(badEmail.body.error.code).toBe('INVALID_INPUT');

    const shortPassword = await request(app).post('/api/auth/register').send({
      email: `short.${uniqueSuffix}@singslot.local`,
      password: 'short',
      fullName: 'Test User'
    });
    expect(shortPassword.status).toBe(400);
    expect(shortPassword.body.error.code).toBe('INVALID_INPUT');

    const emptyName = await request(app).post('/api/auth/register').send({
      email: `noname.${uniqueSuffix}@singslot.local`,
      password: 'StrongPass123!',
      fullName: '   '
    });
    expect(emptyName.status).toBe(400);
    expect(emptyName.body.error.code).toBe('INVALID_INPUT');
  });

  it('TEST-12: ignores forged role=STAFF in payload and enforces CUSTOMER role on protected routes', async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: forgedEmail,
        password: 'StrongPass123!',
        fullName: 'Privilege Test',
        role: 'STAFF'
      });

    expect(regRes.status).toBe(201);
    expect(regRes.body.user.role).toBe('CUSTOMER');

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: forgedEmail, password: 'StrongPass123!' });
    expect(loginRes.status).toBe(200);

    const masterRes = await request(app)
      .get('/api/bookings/master')
      .set('Authorization', `Bearer ${loginRes.body.token}`);
    expect(masterRes.status).toBe(403);
    expect(masterRes.body.error.code).toBe('FORBIDDEN');
  });
});
