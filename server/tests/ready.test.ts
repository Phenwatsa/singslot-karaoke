import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { app } from '../src/app';
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

    app(req, res);
  });
}

describe('Readiness Probe Endpoint (/api/ready) & Cloud Readiness Contracts (R-02, R-04)', () => {
  const originalQueryRaw = prisma.$queryRaw;

  afterEach(() => {
    // Restore original query method after each test
    prisma.$queryRaw = originalQueryRaw;
  });

  describe('Twelve-Factor Configuration & Static Analysis Verification', () => {
    const serverPath = path.resolve(__dirname, '../src/server.ts');
    const seedPath = path.resolve(__dirname, '../prisma/seed.ts');
    const envExamplePath = path.resolve(__dirname, '../.env.example');
    const clientModalPath = path.resolve(__dirname, '../../client/src/components/auth/LoginModal.tsx');

    it('server.ts binds PORT dynamically from process.env.PORT and binds to 0.0.0.0', () => {
      expect(fs.existsSync(serverPath)).toBe(true);
      const content = fs.readFileSync(serverPath, 'utf8');

      expect(content).toMatch(/Number\(process\.env\.PORT\)\s*\|\|\s*8080/);
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

    it('.env.example documents STAFF_PASSWORD and CUSTOMER_PASSWORD placeholders with zero secrets', () => {
      expect(fs.existsSync(envExamplePath)).toBe(true);
      const content = fs.readFileSync(envExamplePath, 'utf8');

      expect(content).toMatch(/STAFF_PASSWORD=replace_with_/);
      expect(content).toMatch(/CUSTOMER_PASSWORD=replace_with_/);
      expect(content).not.toMatch(/Pass1234!/);
    });

    it('client LoginModal.tsx reads VITE_DEMO_PASSWORD and restricts quick-fill to development mode', () => {
      expect(fs.existsSync(clientModalPath)).toBe(true);
      const content = fs.readFileSync(clientModalPath, 'utf8');

      expect(content).toMatch(/VITE_DEMO_PASSWORD/);
      expect(content).toMatch(/import\.meta\.env\.DEV/);
      expect(content).not.toMatch(/Pass1234!/);
    });
  });

  describe('Readiness Probe Dynamic Execution Contract', () => {
    it('returns HTTP 200 { status: "ready", db: "connected" } when database query succeeds', async () => {
      // Mock Prisma query to resolve successfully
      prisma.$queryRaw = jest.fn().mockResolvedValue([{ '?column?': 1 }]);

      const res = await dispatchReadyRequest();
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'ready',
        db: 'connected'
      });
    });

    it('returns HTTP 503 { status: "not_ready", error: "Database unreachable" } when database query fails', async () => {
      // Mock Prisma query to reject with database connection error
      prisma.$queryRaw = jest.fn().mockRejectedValue(new Error('Connection terminated unexpectedly: postgres://user:secret@localhost:5432'));

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
      // Mock Prisma query to hang indefinitely
      prisma.$queryRaw = jest.fn().mockImplementation(() => new Promise(() => {}));

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
    }, 5000);

    it('deduplicates concurrent probes via single-flight activeDbCheck to prevent connection pool exhaustion', async () => {
      let queryCallCount = 0;
      prisma.$queryRaw = jest.fn().mockImplementation(async () => {
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
  });
});

