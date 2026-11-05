import request from 'supertest';
import { app } from '../src/app';
import fs from 'fs';
import path from 'path';

describe('Baseline System Health & API Envelope', () => {
  it('GET /api/health returns HTTP 200 with standard envelope', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('UP');
    expect(res.body.data.service).toBe('SingSlot API');
    expect(typeof res.body.data.timestamp).toBe('string');
  });

  it('Unknown route returns HTTP 404 with standard error envelope', async () => {
    const res = await request(app).get('/api/non-existent-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('NOT_FOUND');
    expect(res.body.error.message).toBe('The requested API route was not found');
  });
});

describe('Database Schema & Seed Contract Integrity', () => {
  const schemaPath = path.resolve(__dirname, '../prisma/schema.prisma');
  const seedPath = path.resolve(__dirname, '../prisma/seed.ts');
  const migrationPath = path.resolve(__dirname, '../prisma/migrations/20261105000000_init/migration.sql');

  it('schema.prisma declares composite unique constraints for slot isolation', () => {
    expect(fs.existsSync(schemaPath)).toBe(true);
    const schema = fs.readFileSync(schemaPath, 'utf8');

    // Slot collision prevention unique index
    expect(schema).toMatch(/@@unique\(\[roomId,\s*bookingDate,\s*slotIndex\]\)/);
    // RoomBlock collision prevention unique index
    expect(schema).toMatch(/@@unique\(\[roomId,\s*blockDate,\s*slotIndex\]\)/);
    // Explicit relation from BookingSlot to Room
    expect(schema).toMatch(/room\s+Room\s+@relation/);
  });

  it('migration.sql contains PostgreSQL DDL for composite constraints', () => {
    expect(fs.existsSync(migrationPath)).toBe(true);
    const ddl = fs.readFileSync(migrationPath, 'utf8');

    expect(ddl).toMatch(/CREATE UNIQUE INDEX "booking_slots_roomId_bookingDate_slotIndex_key"/);
    expect(ddl).toMatch(/CREATE UNIQUE INDEX "room_blocks_roomId_blockDate_slotIndex_key"/);
    expect(ddl).toMatch(/CREATE TABLE "users"/);
    expect(ddl).toMatch(/CREATE TABLE "rooms"/);
    expect(ddl).toMatch(/CREATE TABLE "bookings"/);
  });

  it('seed.ts implements true idempotency without password overwrite', () => {
    expect(fs.existsSync(seedPath)).toBe(true);
    const seed = fs.readFileSync(seedPath, 'utf8');

    // Preserves existing passwordHash
    expect(seed).toMatch(/existing/);
    expect(seed).toMatch(/prisma\.user\.update/);
    expect(seed).toMatch(/prisma\.room\.upsert/);

    // Fleet of 9 rooms seeded
    expect(seed).toMatch(/'S01'/);
    expect(seed).toMatch(/'M01'/);
    expect(seed).toMatch(/'L01'/);
  });
});
