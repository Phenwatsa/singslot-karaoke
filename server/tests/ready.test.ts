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

  describe('Twelve-Factor Configuration & Six-Point Cloud-Readiness Static Analysis', () => {
    const serverPath = path.resolve(__dirname, '../src/server.ts');
    const seedPath = path.resolve(__dirname, '../prisma/seed.ts');
    const envExamplePath = path.resolve(__dirname, '../.env.example');
    const clientModalPath = path.resolve(__dirname, '../../client/src/components/auth/LoginModal.tsx');
    const packageJsonPath = path.resolve(__dirname, '../package.json');
    const authMiddlewarePath = path.resolve(__dirname, '../src/middlewares/auth.ts');
    const appPath = path.resolve(__dirname, '../src/app.ts');

    it('Checklist 1 (Uploaded Files Isolation): zero file upload dependencies and zero local container file storage', () => {
      // INTENTIONAL FAILURE: Proof of branch protection merge gate (Requirement C-02, Issue #19)
      expect(fs.existsSync(packageJsonPath)).toBe(false);
      const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      // Asserts zero file upload middleware (multer, busboy, formidable)
      expect(deps).not.toHaveProperty('multer');
      expect(deps).not.toHaveProperty('formidable');
      expect(deps).not.toHaveProperty('busboy');

      // Asserts Express app does not mount local upload directories
      const appContent = fs.readFileSync(appPath, 'utf8');
      expect(appContent).not.toMatch(/multer/i);
      expect(appContent).not.toMatch(/uploads\//i);
    });

    it('Checklist 2 (Production-Safe Seed & Idempotency): reads passwords from env and implements idempotent upsert', () => {
      expect(fs.existsSync(seedPath)).toBe(true);
      const content = fs.readFileSync(seedPath, 'utf8');

      expect(content).toMatch(/process\.env\.STAFF_PASSWORD/);
      expect(content).toMatch(/process\.env\.CUSTOMER_PASSWORD/);
      expect(content).not.toMatch(/Pass1234!/);
      // Asserts idempotent user and room upserts / existence checks
      expect(content).toMatch(/upsert|findUnique/);
    });

    it('Checklist 3 (No Development Shortcuts in Production): LoginModal restricts quick-fill to development mode', () => {
      expect(fs.existsSync(clientModalPath)).toBe(true);
      const content = fs.readFileSync(clientModalPath, 'utf8');

      expect(content).toMatch(/VITE_STAFF_DEMO_PASSWORD/);
      expect(content).toMatch(/VITE_CUSTOMER_DEMO_PASSWORD/);
      expect(content).toMatch(/VITE_DEMO_PASSWORD/);
      expect(content).toMatch(/import\.meta\.env\.DEV/);
      expect(content).not.toMatch(/Pass1234!/);
    });

    it('Checklist 4 (Stateless Session Management): relies strictly on signed JWT tokens without local session store', () => {
      expect(fs.existsSync(authMiddlewarePath)).toBe(true);
      const content = fs.readFileSync(authMiddlewarePath, 'utf8');

      expect(content).toMatch(/jwt\.verify/);
      expect(content).not.toMatch(/express-session/);
      expect(content).not.toMatch(/sessionStore/i);
    });

    it('Checklist 5 (Dynamic Port & Host Binding): server.ts reads PORT from env (5001 dev / 8080 prod) and binds to 0.0.0.0', () => {
      expect(fs.existsSync(serverPath)).toBe(true);
      const content = fs.readFileSync(serverPath, 'utf8');

      expect(content).toMatch(/Number\(process\.env\.PORT\)\s*\|\|\s*DEFAULT_PORT/);
      expect(content).toMatch(/DEFAULT_PORT\s*=\s*process\.env\.NODE_ENV\s*===\s*['"]production['"]\s*\?\s*8080\s*:\s*5001/);
      expect(content).toMatch(/HOST\s*=\s*['"]0\.0\.0\.0['"]/);
      expect(content).toMatch(/app\.listen\(PORT,\s*HOST/);
    });

    it('Checklist 5b (.env.example): documents development port 5001 and password placeholders with zero secrets', () => {
      expect(fs.existsSync(envExamplePath)).toBe(true);
      const content = fs.readFileSync(envExamplePath, 'utf8');

      expect(content).toMatch(/PORT=5001/);
      expect(content).toMatch(/STAFF_PASSWORD=replace_with_/);
      expect(content).toMatch(/CUSTOMER_PASSWORD=replace_with_/);
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

    it('guarantees zero query accumulation across repeated probe timeouts while database query is pending, and recovers cleanly when query settles', async () => {
      let resolveQuery: (value: any) => void = () => {};
      let queryCallCount = 0;

      // Mock query that remains pending in the database driver
      (prisma as any).$queryRaw = jest.fn<any>().mockImplementation(() => {
        queryCallCount++;
        return new Promise((resolve) => {
          resolveQuery = resolve;
        });
      });

      // 1. Dispatch first probe (Probe 1) -> times out after 3000ms -> returns 503
      const probe1Res = await dispatchReadyRequest();
      expect(probe1Res.status).toBe(503);
      expect(probe1Res.body).toEqual({
        status: 'not_ready',
        error: 'Database unreachable'
      });
      expect(queryCallCount).toBe(1);

      // 2. Dispatch repeated subsequent probes while the original database query is STILL pending
      // Concurrency invariant: Zero new queries may be created while a query is unresolved!
      const probe2Res = await dispatchReadyRequest();
      expect(probe2Res.status).toBe(503);
      expect(queryCallCount).toBe(1); // STILL 1!

      const probe3Res = await dispatchReadyRequest();
      expect(probe3Res.status).toBe(503);
      expect(queryCallCount).toBe(1); // STILL 1!

      // 3. Now the database driver query finally settles
      resolveQuery([{ '?column?': 1 }]);
      await new Promise((r) => setTimeout(r, 20));

      // 4. Once the query has settled, subsequent probe creates a fresh query and immediately recovers to 200
      (prisma as any).$queryRaw = jest.fn<any>().mockImplementation(async () => {
        queryCallCount++;
        return [{ '?column?': 1 }];
      });
      const probe4Res = await dispatchReadyRequest();
      expect(probe4Res.status).toBe(200);
      expect(probe4Res.body).toEqual({
        status: 'ready',
        db: 'connected'
      });
      expect(queryCallCount).toBe(2);
    }, 12000);
  });
});
