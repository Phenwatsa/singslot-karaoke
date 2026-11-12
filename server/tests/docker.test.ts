/// <reference types="jest" />
import { describe, it, expect } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { EventEmitter } from 'events';
import { app } from '../src/app';

// Helper to simulate request without raw socket
function dispatchMockRequest(method: string, url: string): Promise<{ status: number; body: any; headers: Record<string, string> }> {
  return new Promise((resolve) => {
    const req: any = new EventEmitter();
    req.method = method;
    req.url = url;
    req.path = url.split('?')[0];
    req.headers = {};

    let statusCode = 200;
    const responseHeaders: Record<string, string> = {};
    const res: any = {
      setHeader(k: string, v: string) {
        responseHeaders[k.toLowerCase()] = String(v);
      },
      getHeader(k: string) {
        return responseHeaders[k.toLowerCase()];
      },
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(data: any) {
        resolve({ status: statusCode, body: data, headers: responseHeaders });
      },
      send(data: any) {
        resolve({ status: statusCode, body: data, headers: responseHeaders });
      },
      sendFile(filePath: string) {
        resolve({ status: statusCode, body: fs.readFileSync(filePath, 'utf8'), headers: responseHeaders });
      }
    };

    (app as any)(req, res);
  });
}

describe('Task 3: Docker Containerization & SPA Routing Contracts (R-01, C-03)', () => {
  const rootDir = path.resolve(__dirname, '../../');
  const dockerfilePath = path.join(rootDir, 'Dockerfile');
  const dockerignorePath = path.join(rootDir, '.dockerignore');
  const dockerComposePath = path.join(rootDir, 'docker-compose.yml');
  const entrypointPath = path.join(rootDir, 'server/docker-entrypoint.sh');
  const appPath = path.join(rootDir, 'server/src/app.ts');

  describe('Root Dockerfile Multi-Stage Contract', () => {
    it('declares root Dockerfile with 3 dedicated stages (client-builder, server-builder, production)', () => {
      expect(fs.existsSync(dockerfilePath)).toBe(true);
      const content = fs.readFileSync(dockerfilePath, 'utf8');

      expect(content).toMatch(/FROM\s+node:24-alpine\s+AS\s+client-builder/i);
      expect(content).toMatch(/FROM\s+node:24-alpine\s+AS\s+server-builder/i);
      expect(content).toMatch(/FROM\s+node:24-alpine\s+AS\s+production/i);
    });

    it('client-builder stage builds Vite frontend bundle with empty API URL for same-origin proxy', () => {
      const content = fs.readFileSync(dockerfilePath, 'utf8');
      expect(content).toMatch(/WORKDIR\s+\/app\/client/);
      expect(content).toMatch(/ENV\s+VITE_API_URL=["']?["']?/);
      expect(content).toMatch(/RUN\s+npm\s+run\s+build/);
    });

    it('server-builder stage compiles TypeScript and explicitly executes Prisma Client generation from schema', () => {
      const content = fs.readFileSync(dockerfilePath, 'utf8');
      expect(content).toMatch(/WORKDIR\s+\/app\/server/);
      expect(content).toMatch(/apk\s+add\s+--no-cache\s+openssl/);
      expect(content).toMatch(/npx\s+prisma\s+generate\s+--schema=prisma\/schema\.prisma/);
      expect(content).toMatch(/npm\s+run\s+build/);
    });

    it('production stage sets working directory to /app/server and copies both server and client artifacts', () => {
      const content = fs.readFileSync(dockerfilePath, 'utf8');
      expect(content).toMatch(/WORKDIR\s+\/app\/server/);
      expect(content).toMatch(/COPY\s+--from=server-builder.*\/app\/server\/dist\s+\.\/dist/);
      expect(content).toMatch(/COPY\s+--from=server-builder.*\/app\/server\/prisma\s+\.\/prisma/);
      expect(content).toMatch(/COPY\s+--from=server-builder.*\/app\/server\/node_modules\s+\.\/node_modules/);
      expect(content).toMatch(/COPY\s+--from=client-builder.*\/app\/client\/dist\s+\/app\/client\/dist/);
    });

    it('production stage enforces non-root USER node and configures port 8080 and graceful entrypoint', () => {
      const content = fs.readFileSync(dockerfilePath, 'utf8');
      expect(content).toMatch(/ENV\s+PORT=8080/);
      expect(content).toMatch(/EXPOSE\s+8080/);
      expect(content).toMatch(/USER\s+node/);
      expect(content).toMatch(/ENTRYPOINT\s+\[["']\.\/docker-entrypoint\.sh["']\]/);
      expect(content).toMatch(/CMD\s+\[["']node["'],\s*["']dist\/server\.js["']\]/);
    });

    it('entrypoint script exists, is executable, and uses exec "$@" for PID 1 signal forwarding', () => {
      expect(fs.existsSync(entrypointPath)).toBe(true);
      const content = fs.readFileSync(entrypointPath, 'utf8');
      expect(content).toMatch(/exec\s+"\$@"/);
    });
  });

  describe('.dockerignore Isolation Contract', () => {
    it('excludes node_modules, build outputs, environment files, and version control', () => {
      expect(fs.existsSync(dockerignorePath)).toBe(true);
      const content = fs.readFileSync(dockerignorePath, 'utf8');

      expect(content).toMatch(/node_modules/);
      expect(content).toMatch(/dist/);
      expect(content).toMatch(/\.env/);
      expect(content).toMatch(/\.git/);
    });
  });

  describe('docker-compose.yml Orchestration Contract', () => {
    it('defines postgres database service with healthcheck and persistent volume', () => {
      expect(fs.existsSync(dockerComposePath)).toBe(true);
      const content = fs.readFileSync(dockerComposePath, 'utf8');

      expect(content).toMatch(/image:\s*postgres:16-alpine/);
      expect(content).toMatch(/healthcheck:/);
      expect(content).toMatch(/pg_isready/);
      expect(content).toMatch(/postgres_data:/);
    });

    it('defines migration runner service that waits for db health and executes migrate + seed', () => {
      const content = fs.readFileSync(dockerComposePath, 'utf8');
      expect(content).toMatch(/container_name:\s*singslot-migrate/);
      expect(content).toMatch(/condition:\s*service_healthy/);
      expect(content).toMatch(/npx\s+prisma\s+migrate\s+deploy\s+&&\s+npm\s+run\s+prisma:seed/);
    });

    it('defines unified app service that waits for successful migration and exposes port 8080', () => {
      const content = fs.readFileSync(dockerComposePath, 'utf8');
      expect(content).toMatch(/container_name:\s*singslot-app/);
      expect(content).toMatch(/condition:\s*service_completed_successfully/);
      expect(content).toMatch(/["']8080:8080["']/);
    });
  });

  describe('SPA Routing & Unmatched /api 404 Protection Contract (app.ts)', () => {
    it('strictly returns JSON 404 for unmatched /api requests without swallowing into HTML', async () => {
      const res = await dispatchMockRequest('GET', '/api');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
      expect(res.body.error.message).toBe('The requested API route was not found');
    });

    it('strictly returns JSON 404 for unmatched /api/unknown-endpoint requests', async () => {
      const res = await dispatchMockRequest('GET', '/api/non-existent-subpath');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('strictly returns JSON 404 for non-GET unmatched /api requests', async () => {
      const res = await dispatchMockRequest('POST', '/api/invalid-action');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    it('declares unambiguous route order where /api catch-all precedes static and SPA fallback', () => {
      const appContent = fs.readFileSync(appPath, 'utf8');
      const apiUnmatchedPos = appContent.indexOf("app.all(['/api', '/api/*']");
      const staticPos = appContent.indexOf('app.use(express.static(');

      expect(apiUnmatchedPos).toBeGreaterThan(0);
      expect(staticPos).toBeGreaterThan(0);
      expect(apiUnmatchedPos).toBeLessThan(staticPos);
    });
  });
});
