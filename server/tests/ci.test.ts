import fs from 'fs';
import path from 'path';

describe('Task 4: CI Quality Gate on Pull Requests & Deployment Tooling (R-05, R-07, C-01)', () => {
  const rootDir = path.resolve(__dirname, '../..');
  const workflowPath = path.join(rootDir, '.github/workflows/ci-docker.yml');

  describe('.github/workflows/ci-docker.yml Workflow Contract', () => {
    it('declares the CI workflow file with correct metadata, permissions, and concurrency', () => {
      expect(fs.existsSync(workflowPath)).toBe(true);
      const content = fs.readFileSync(workflowPath, 'utf8');

      // Workflow name
      expect(content).toMatch(/name:\s*CI & Docker Build/);

      // Reusable and branch triggers
      expect(content).toMatch(/workflow_call:/);
      expect(content).toMatch(/workflow_dispatch:/);
      expect(content).toMatch(/pull_request:\s*\n\s*branches:\s*\[.*sprint-1-staging.*main.*\]/);

      // Security: least privilege
      expect(content).toMatch(/permissions:\s*\n\s*contents:\s*read/);

      // Concurrency cancellation
      expect(content).toMatch(/concurrency:\s*\n\s*group:\s*ci-\$\{\{\s*github\.workflow\s*\}\}-\$\{\{\s*github\.ref\s*\}\}\s*\n\s*cancel-in-progress:\s*true/);

      // Mandatory job ID
      expect(content).toMatch(/test-and-docker:/);
    });

    it('configures PostgreSQL 16 Alpine service container with healthy readiness probe options', () => {
      const content = fs.readFileSync(workflowPath, 'utf8');

      expect(content).toMatch(/image:\s*postgres:16-alpine/);
      expect(content).toMatch(/POSTGRES_USER:\s*postgres/);
      expect(content).toMatch(/POSTGRES_PASSWORD:\s*postgres/);
      expect(content).toMatch(/POSTGRES_DB:\s*singslot_test/);
      expect(content).toMatch(/ports:\s*\n\s*-\s*5432:5432/);
      expect(content).toMatch(/--health-cmd\s*"pg_isready -U postgres -d singslot_test"/);
      expect(content).toMatch(/--health-interval\s*10s/);
      expect(content).toMatch(/--health-timeout\s*5s/);
      expect(content).toMatch(/--health-retries\s*5/);
    });

    it('injects all required test environment variables into CI job env', () => {
      const content = fs.readFileSync(workflowPath, 'utf8');

      expect(content).toMatch(/DATABASE_URL:\s*postgresql:\/\/postgres:postgres@localhost:5432\/singslot_test\?schema=public/);
      expect(content).toMatch(/STAFF_PASSWORD:\s*ci-test-staff-pass-123!/);
      expect(content).toMatch(/CUSTOMER_PASSWORD:\s*ci-test-cust-pass-123!/);
      expect(content).toMatch(/JWT_SECRET:\s*ci-test-jwt-secret-for-testing-only-not-production/);
      expect(content).toMatch(/PORT:\s*8080/);
    });

    it('declares exact language setup and ordered pipeline steps', () => {
      const content = fs.readFileSync(workflowPath, 'utf8');

      // Actions versions and setup
      expect(content).toMatch(/actions\/checkout@v4/);
      expect(content).toMatch(/actions\/setup-node@v4/);
      expect(content).toMatch(/node-version:\s*"20"/);
      expect(content).toMatch(/cache:\s*"npm"/);
      expect(content).toMatch(/actions\/setup-python@v5/);
      expect(content).toMatch(/python-version:\s*"3.12"/);

      // Step sequence verification
      const npmCiIdx = content.indexOf('npm ci');
      const offlineCheckIdx = content.indexOf('Check deployment scripts without accessing GCP');
      const migrateIdx = content.indexOf('npx prisma migrate deploy');
      const seedIdx = content.indexOf('npm run prisma:seed');
      const typecheckIdx = content.indexOf('npm run typecheck');
      const testServerIdx = content.indexOf('npm run test:server');
      const testClientIdx = content.indexOf('npm run test:client');
      const buildIdx = content.indexOf('npm run build');
      const dockerBuildIdx = content.indexOf('docker build -t singslot-app:latest .');

      expect(npmCiIdx).toBeGreaterThan(0);
      expect(offlineCheckIdx).toBeGreaterThan(npmCiIdx);
      expect(migrateIdx).toBeGreaterThan(offlineCheckIdx);
      expect(seedIdx).toBeGreaterThan(migrateIdx);
      expect(typecheckIdx).toBeGreaterThan(seedIdx);
      expect(testServerIdx).toBeGreaterThan(typecheckIdx);
      expect(testClientIdx).toBeGreaterThan(testServerIdx);
      expect(buildIdx).toBeGreaterThan(testClientIdx);
      expect(dockerBuildIdx).toBeGreaterThan(buildIdx);
    });
  });

  describe('Deployment Automation Tooling & Offline Verification Suites (deploy/)', () => {
    const deployFiles = [
      'deploy/deploy.sh',
      'deploy/release.sh',
      'deploy/teardown.sh',
      'deploy/smoke_test.py',
      'deploy/tests/test_deploy_stub.sh',
      'deploy/tests/test_release_stub.sh',
      'deploy/tests/test_teardown_stub.sh',
      'deploy/tests/test_smoke.py'
    ];

    it.each(deployFiles)('verifies existence and structure of %s', (filePath) => {
      const fullPath = path.join(rootDir, filePath);
      expect(fs.existsSync(fullPath)).toBe(true);
      const stat = fs.statSync(fullPath);
      expect(stat.size).toBeGreaterThan(100);
    });

    it('verifies deploy.sh conforms to SingSlot GCP resource specifications (Table 4)', () => {
      const content = fs.readFileSync(path.join(rootDir, 'deploy/deploy.sh'), 'utf8');

      expect(content).toMatch(/REPO_NAME="singslot"/);
      expect(content).toMatch(/SQL_INSTANCE="singslot-pg"/);
      expect(content).toMatch(/DB_NAME="singslot"/);
      expect(content).toMatch(/DB_USER="singslot"/);
      expect(content).toMatch(/SERVICE_NAME="singslot"/);
      expect(content).toMatch(/MIGRATE_JOB_NAME="singslot-migrate"/);
      expect(content).toMatch(/SA_NAME="singslot-runner"/);

      // Secret names
      expect(content).toMatch(/SECRET_DB_URL="singslot-database-url"/);
      expect(content).toMatch(/SECRET_JWT_KEY="singslot-jwt-secret"/);
      expect(content).toMatch(/SECRET_STAFF_PASS="singslot-staff-password"/);
      expect(content).toMatch(/SECRET_CUST_PASS="singslot-customer-password"/);

      // Flag requirements
      expect(content).toMatch(/--database-version=POSTGRES_16/);
      expect(content).toMatch(/--edition=enterprise/);
      expect(content).toMatch(/--tier=db-f1-micro/);
      expect(content).toMatch(/--no-storage-auto-increase/);
      expect(content).toMatch(/--port 8080/);
    });

    it('verifies release.sh pins immutable image digest and gates migration', () => {
      const content = fs.readFileSync(path.join(rootDir, 'deploy/release.sh'), 'utf8');

      expect(content).toMatch(/singslot\/singslot/);
      expect(content).toMatch(/gcloud artifacts docker images describe/);
      expect(content).toMatch(/@sha256:/);
      expect(content).toMatch(/gcloud run jobs execute "\$MIGRATE_JOB_NAME" --wait/);
      expect(content).toMatch(/gcloud run services update "\$SERVICE_NAME"/);
      expect(content).toMatch(/gcloud run services update-traffic "\$SERVICE_NAME" --to-latest/);
    });

    it('verifies teardown.sh requires confirmation and safely purges all resources', () => {
      const content = fs.readFileSync(path.join(rootDir, 'deploy/teardown.sh'), 'utf8');

      expect(content).toMatch(/CONFIRM_PROJECT/);
      expect(content).toMatch(/gcloud run services delete "\$SERVICE_NAME"/);
      expect(content).toMatch(/gcloud run jobs delete "\$MIGRATE_JOB_NAME"/);
      expect(content).toMatch(/gcloud sql instances delete "\$SQL_INSTANCE"/);
      expect(content).toMatch(/gcloud artifacts repositories delete "\$REPO_NAME"/);
      expect(content).toMatch(/gcloud secrets delete "\$SECRET_DB_URL"/);
      expect(content).toMatch(/gcloud secrets delete "\$SECRET_JWT_KEY"/);
      expect(content).toMatch(/gcloud secrets delete "\$SECRET_STAFF_PASS"/);
      expect(content).toMatch(/gcloud secrets delete "\$SECRET_CUST_PASS"/);
      expect(content).toMatch(/gcloud iam service-accounts delete "\$RUNNER_SA_EMAIL"/);
      expect(content).toMatch(/gcloud iam service-accounts delete "\$MIGRATOR_SA_EMAIL"/);
      expect(content).toMatch(/gcloud iam service-accounts delete "\$DEPLOYER_SA_EMAIL"/);
    });

    it('verifies smoke_test.py checks health, ready, static SPA HTML, and seeded rooms', () => {
      const content = fs.readFileSync(path.join(rootDir, 'deploy/smoke_test.py'), 'utf8');

      expect(content).toMatch(/\/api\/health/);
      expect(content).toMatch(/\/api\/ready/);
      expect(content).toMatch(/\/api\/rooms/);
      expect(content).toMatch(/\/api\/auth\/login/);
      expect(content).toMatch(/\/api\/auth\/me/);
      expect(content).toMatch(/\/api\/auth\/logout/);
    });
  });

  describe('Task 7: Automated Deployment Pipeline Contract (.github/workflows/deploy.yml)', () => {
    const deployWorkflowPath = path.join(rootDir, '.github/workflows/deploy.yml');

    it('verifies deploy.yml exists and conforms to SingSlot CD specification', () => {
      expect(fs.existsSync(deployWorkflowPath)).toBe(true);
      const content = fs.readFileSync(deployWorkflowPath, 'utf8');

      // Exact workflow name
      expect(content).toMatch(/name:\s*Deploy demo/);

      // Triggers: main branch and workflow_dispatch rollback
      expect(content).toMatch(/branches:\s*\[main\]/);
      expect(content).toMatch(/workflow_dispatch:/);
      expect(content).toMatch(/image_tag:/);

      // Concurrency and permissions
      expect(content).toMatch(/group:\s*deploy-demo/);
      expect(content).toMatch(/cancel-in-progress:\s*false/);
      expect(content).toMatch(/id-token:\s*write/);

      // Environment and environment variables from GitHub demo environment
      expect(content).toMatch(/environment:\s*demo/);
      expect(content).toMatch(/PROJECT_ID:\s*\$\{\{\s*vars\.GCP_PROJECT_ID\s*\}\}/);
      expect(content).toMatch(/REGION:\s*\$\{\{\s*vars\.GCP_REGION\s*\}\}/);
      expect(content).toMatch(/WIF_PROVIDER:\s*\$\{\{\s*vars\.WIF_PROVIDER\s*\}\}/);
      expect(content).toMatch(/WIF_SERVICE_ACCOUNT:\s*\$\{\{\s*vars\.WIF_SERVICE_ACCOUNT\s*\}\}/);

      // Quality gate: reuses ci-docker.yml
      expect(content).toMatch(/uses:\s*\.\/\.github\/workflows\/ci-docker\.yml/);

      // Keyless WIF authentication
      expect(content).toMatch(/uses:\s*google-github-actions\/auth@v2/);
      expect(content).toMatch(/uses:\s*google-github-actions\/setup-gcloud@v2/);

      // Deployment pipeline sequence: Build -> Digest -> Migrate -> Service -> Smoke test
      expect(content).toMatch(/docker build/);
      expect(content).toMatch(/docker push/);
      expect(content).toMatch(/gcloud artifacts docker images describe/);
      expect(content).toMatch(/gcloud run jobs update singslot-migrate/);
      expect(content).toMatch(/gcloud run jobs execute singslot-migrate/);
      expect(content).toMatch(/gcloud run services update singslot/);
      expect(content).toMatch(/gcloud run services update-traffic singslot/);
      expect(content).toMatch(/python3 deploy\/smoke_test\.py/);
      expect(content).toMatch(/GITHUB_STEP_SUMMARY/);
    });
  });
});

