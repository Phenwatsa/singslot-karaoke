/// <reference types="jest" />
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { app, _resetActiveDbCheck } from '../src/app';
import { prisma } from '../src/prisma';

// Helper to execute Express app pipeline in-memory without loopback network socket
function dispatchReadyRequest(): Promise<{ status: number; body: any }> {
  return new Promise((resolve) => {
    const req: any = new EventEmitter();
    req.method = 'GET';
    req.url = '/api/ready';
    req.headers = {};

    let statusCode = 200;
    const res: any = {
      setHeader() {},
      getHeader() {},
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        resolve({ status: statusCode, body: data });
      }
    };

    (app as any)(req, res);
  });
}

describe('Readiness Probe Endpoint (/api/ready) & Cloud Readiness Contracts (R-02, R-04)', () => {
  const originalQueryRaw = prisma.$queryRaw;

  beforeEach(() => {
    _resetActiveDbCheck();
  });

  afterEach(() => {
    // Restore original query method after each test and reset in-flight state
    prisma.$queryRaw = originalQueryRaw;
    _resetActiveDbCheck();
  });

  describe('Twelve-Factor Configuration & Static Analysis Verification', () => {
    const serverPath = path.resolve(__dirname, '../src/server.ts');
    const seedPath = path.resolve(__dirname, '../prisma/seed.ts');
    const envExamplePath = path.resolve(__dirname, '../.env.example');
    const clientModalPath = path.resolve(__dirname, '../../client/src/components/auth/LoginModal.tsx');

    it('server.ts binds PORT dynamically from process.env.PORT and binds to 0.0.0.0', () => {
      expect(fs.existsSync(serverPath)).toBe(true);
      const content = fs.readFileSync(serverPath, 'utf8');

      expect(content).toMatch(/Number\(process\.env\.PORT\)\s*\|\|\s*DEFAULT_PORT/);
      expect(content).toMatch(/DEFAULT_PORT\s*=\s*process\.env\.NODE_ENV\s*===\s*['"]production['"]\s*\?\s*8080\s*:\s*5001/);
      expect(content).toMatch(/HOST\s*=\s*['"]0\.0\.0\.0['"]/);
      expect(content).toMatch(/app\.listen\(PORT,\s*HOST/);
    });

    it('prisma/seed.ts reads STAFF_PASSWORD and CUSTOMER_PASSWORD from env and has zero hardcoded passwords', () => {
      expect(fs.existsSync(seedPath)).toBe(true);
      const content = fs.readFileSync(seedPath, 'utf8');

      expect(content).toMatch(/process\.env\.STAFF_PASSWORD/);
      expect(content).toMatch(/process\.env\.CUSTOMER_PASSWORD/);
      expect(content).not.toMatch(/Pass1234!/);
    });

    it('.env.example documents development port 5001 and password placeholders with zero secrets', () => {
      expect(fs.existsSync(envExamplePath)).toBe(true);
      const content = fs.readFileSync(envExamplePath, 'utf8');

      expect(content).toMatch(/PORT=5001/);
      expect(content).toMatch(/STAFF_PASSWORD=replace_with_/);
      expect(content).toMatch(/CUSTOMER_PASSWORD=replace_with_/);
      expect(content).not.toMatch(/Pass1234!/);
    });

    it('client LoginModal.tsx supports role-specific demo passwords and restricts quick-fill to development mode', () => {
      expect(fs.existsSync(clientModalPath)).toBe(true);
      const content = fs.readFileSync(clientModalPath, 'utf8');

      expect(content).toMatch(/VITE_STAFF_DEMO_PASSWORD/);
      expect(content).toMatch(/VITE_CUSTOMER_DEMO_PASSWORD/);
      expect(content).toMatch(/VITE_DEMO_PASSWORD/);
      expect(content).toMatch(/import\.meta\.env\.DEV/);
      expect(content).not.toMatch(/Pass1234!/);
    });
  });

  describe('Readiness Probe Dynamic Execution Contract', () => {
    it('returns HTTP 200 { status: "ready", db: "connected" } when database query succeeds', async () => {
      // Mock Prisma query to resolve successfully
      (prisma as any).$queryRaw = jest.fn<any>().mockResolvedValue([{ '?column?': 1 }]);

      const res = await dispatchReadyRequest();
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'ready',
        db: 'connected'
      });
    });

    it('returns HTTP 503 { status: "not_ready", error: "Database unreachable" } when database query fails', async () => {
      // Mock Prisma query to reject with database connection error
      (prisma as any).$queryRaw = jest.fn<any>().mockRejectedValue(new Error('Connection terminated unexpectedly: postgres://user:secret@localhost:5432'));

      const res = await dispatchReadyRequest();
      expect(res.status).toBe(503);
      expect(res.body).toEqual({
        status: 'not_ready',
        error: 'Database unreachable'
      });

      // Assert zero database credentials, stack traces, or postgres strings leaked in response payload
      const responseString = JSON.stringify(res.body);
      expect(responseString).not.toMatch(/postgres/i);
      expect(responseString).not.toMatch(/secret/i);
      expect(responseString).not.toMatch(/stack/i);
    });

    it('returns HTTP 503 within bounded timeout when database query exceeds 3000ms', async () => {
      let resolveQuery: (value: any) => void = () => {};
      // Mock Prisma query that hangs past 3000ms but can be resolved during test cleanup
      (prisma as any).$queryRaw = jest.fn<any>().mockImplementation(() => new Promise((resolve) => {
        resolveQuery = resolve;
      }));

      const startTime = Date.now();
      const res = await dispatchReadyRequest();
      const durationMs = Date.now() - startTime;

      expect(res.status).toBe(503);
      expect(res.body).toEqual({
        status: 'not_ready',
        error: 'Database unreachable'
      });
      expect(durationMs).toBeGreaterThanOrEqual(2950);
      expect(durationMs).toBeLessThan(3500);

      // Clean up hanging promise
      resolveQuery([{ '?column?': 1 }]);
    }, 5000);

    it('deduplicates concurrent probes via single-flight activeDbCheck to prevent connection pool exhaustion', async () => {
      let queryCallCount = 0;
      (prisma as any).$queryRaw = jest.fn<any>().mockImplementation(async () => {
        queryCallCount++;
        await new Promise((r) => setTimeout(r, 100));
        return [{ '?column?': 1 }];
      });

      // Dispatch 3 concurrent requests simultaneously
      const [res1, res2, res3] = await Promise.all([
        dispatchReadyRequest(),
        dispatchReadyRequest(),
        dispatchReadyRequest()
      ]);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res3.status).toBe(200);
      // All 3 requests must share the single in-flight database query
      expect(queryCallCount).toBe(1);
    });

    it('prevents query accumulation when first probe times out while query is still pending', async () => {
      let resolveQuery: (value: any) => void = () => {};
      let queryCallCount = 0;

      // Mock query that remains pending past the 3000ms request timeout
      (prisma as any).$queryRaw = jest.fn<any>().mockImplementation(() => {
        queryCallCount++;
        return new Promise((resolve) => {
          resolveQuery = resolve;
        });
      });

      // 1. Dispatch first probe (Probe A)
      const probeAPromise = dispatchReadyRequest();

      // Probe A times out after 3000ms and returns 503
      const probeARes = await probeAPromise;
      expect(probeARes.status).toBe(503);
      expect(probeARes.body).toEqual({
        status: 'not_ready',
        error: 'Database unreachable'
      });
      expect(queryCallCount).toBe(1);

      // 2. Dispatch second probe (Probe B) while the original query is STILL pending
      const probeBPromise = dispatchReadyRequest();

      // Verify that Probe B does NOT spawn a new database query!
      expect(queryCallCount).toBe(1);

      // 3. Now let the pending database query finally settle
      resolveQuery([{ '?column?': 1 }]);

      // Probe B finishes successfully with 200
      const probeBRes = await probeBPromise;
      expect(probeBRes.status).toBe(200);
      expect(probeBRes.body).toEqual({
        status: 'ready',
        db: 'connected'
      });

      // Still only 1 query was launched across both probes
      expect(queryCallCount).toBe(1);
    }, 6000);

    it('recovers cleanly and returns HTTP 200 on subsequent probe when underlying database recovers after zombie query', async () => {
      // 1. Configure short stale query TTL (3100ms) for test execution
      const originalStaleTtl = process.env.READINESS_STALE_TTL_MS;
      process.env.READINESS_STALE_TTL_MS = '3100';

      try {
        let queryCount = 0;
        // Probe A experiences a zombie query that never resolves or rejects
        (prisma as any).$queryRaw = jest.fn<any>().mockImplementation(() => {
          queryCount++;
          return new Promise(() => {}); // never settles
        });

        const probeAPromise = dispatchReadyRequest();
        const probeARes = await probeAPromise;

        expect(probeARes.status).toBe(503);
        expect(probeARes.body).toEqual({
          status: 'not_ready',
          error: 'Database unreachable'
        });
        expect(queryCount).toBe(1);

        // Wait for stale query TTL to expire (3100ms - 3000ms = ~150ms remaining)
        await new Promise((r) => setTimeout(r, 200));

        // 2. Database recovers! Mock Prisma query to resolve successfully
        (prisma as any).$queryRaw = jest.fn<any>().mockImplementation(async () => {
          queryCount++;
          return [{ '?column?': 1 }];
        });

        // 3. Subsequent probe (Probe B) arrives after database recovery
        const probeBRes = await dispatchReadyRequest();

        // Must launch a fresh query and succeed with HTTP 200 (no permanent 503 lockout)
        expect(probeBRes.status).toBe(200);
        expect(probeBRes.body).toEqual({
          status: 'ready',
          db: 'connected'
        });
        expect(queryCount).toBe(2);
      } finally {
        process.env.READINESS_STALE_TTL_MS = originalStaleTtl;
      }
    }, 8000);

    it('ensures late-settling stale query does not clobber activeDbCheck or cancel timer of a newly active probe query', async () => {
      const originalStaleTtl = process.env.READINESS_STALE_TTL_MS;
      process.env.READINESS_STALE_TTL_MS = '3100';

      try {
        let resolveQuery1: (val: any) => void = () => {};
        let resolveQuery2: (val: any) => void = () => {};
        let queryCount = 0;

        // Query 1: will hang past 3000ms timeout and past 3100ms TTL
        (prisma as any).$queryRaw = jest.fn<any>().mockImplementation(() => {
          queryCount++;
          return new Promise((resolve) => {
            resolveQuery1 = resolve;
          });
        });

        // 1. Dispatch Probe A (times out at 3000ms -> 503)
        const probeARes = await dispatchReadyRequest();
        expect(probeARes.status).toBe(503);
        expect(queryCount).toBe(1);

        // 2. Wait for stale query TTL to expire (3100ms bound)
        await new Promise((r) => setTimeout(r, 200));

        // 3. Set up Query 2 for Probe B
        (prisma as any).$queryRaw = jest.fn<any>().mockImplementation(() => {
          queryCount++;
          return new Promise((resolve) => {
            resolveQuery2 = resolve;
          });
        });

        // 4. Dispatch Probe B (now in-flight with Query 2)
        const probeBPromise = dispatchReadyRequest();
        expect(queryCount).toBe(2);

        // 5. NOW let Query 1 (the old stale query) finally settle late!
        resolveQuery1([{ '?column?': 1 }]);
        // Give event loop tick for Query 1's .finally() callback to run
        await new Promise((r) => setTimeout(r, 20));

        // 6. Dispatch Probe C while Query 2 is still in-flight
        // Concurrency assertion: Query 1's late settlement MUST NOT have cleared activeDbCheck!
        // Therefore, Probe C MUST coalesce into Query 2 rather than launching Query 3!
        const probeCPromise = dispatchReadyRequest();
        expect(queryCount).toBe(2); // Still 2! Single-flight coalescing was NOT clobbered!

        // 7. Resolve Query 2
        resolveQuery2([{ '?column?': 1 }]);

        const [probeBRes, probeCRes] = await Promise.all([probeBPromise, probeCPromise]);
        expect(probeBRes.status).toBe(200);
        expect(probeBRes.body).toEqual({ status: 'ready', db: 'connected' });
        expect(probeCRes.status).toBe(200);
        expect(probeCRes.body).toEqual({ status: 'ready', db: 'connected' });
      } finally {
        process.env.READINESS_STALE_TTL_MS = originalStaleTtl;
      }
    }, 8000);
  });
});
