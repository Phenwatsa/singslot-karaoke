import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientRoot = path.resolve(__dirname, '..');

test('Client Layout & UI Component Structural Verification (AC-07)', async (t) => {
  await t.test('Layout template files exist in client/src/components/layout/', () => {
    const layoutDir = path.join(clientRoot, 'src', 'components', 'layout');
    assert.strictEqual(fs.existsSync(layoutDir), true, 'layout directory must exist');

    const expectedFiles = ['AppLayout.tsx', 'PageHeader.tsx', 'GlassCard.tsx'];
    for (const file of expectedFiles) {
      const filePath = path.join(layoutDir, file);
      assert.strictEqual(
        fs.existsSync(filePath),
        true,
        `Expected component file ${file} must exist at ${filePath}`
      );
    }
  });

  await t.test('AppLayout declares navigation contracts and placeholder hooks', () => {
    const appLayoutPath = path.join(clientRoot, 'src', 'components', 'layout', 'AppLayout.tsx');
    const content = fs.readFileSync(appLayoutPath, 'utf8');

    // Branding & Core Layout Slots
    assert.match(content, /SingSlot/, 'AppLayout must contain brand title SingSlot');
    assert.match(content, /Rooms & Slots/, 'AppLayout must render Rooms & Slots nav item');
    assert.match(content, /My Bookings/, 'AppLayout must support customer My Bookings');
    assert.match(content, /Master Schedule/, 'AppLayout must support staff Master Schedule');

    // Explicit placeholder navigation callback for Issue #2 / #3
    assert.match(
      content,
      /onNavigate\?:/,
      'AppLayout must support onNavigate prop for routing across upcoming issues'
    );
    assert.match(
      content,
      /onLogout\?:/,
      'AppLayout must support onLogout prop for session management'
    );
  });

  await t.test('App.tsx initializes in unauthenticated state with wired navigation callbacks', () => {
    const appPath = path.join(clientRoot, 'src', 'App.tsx');
    const content = fs.readFileSync(appPath, 'utf8');

    // Unauthenticated baseline (defaults to null user without hardcoded session)
    assert.match(content, /useState<User \| null>\(null\)/, 'App.tsx must default to null user');
    assert.match(content, /useState<string \| null>\(null\)/, 'App.tsx must default to null token');
    assert.match(content, /userRole=\{user\?\.role \|\| null\}/, 'App.tsx must bind userRole from reactive state');
    assert.match(content, /userName=\{user\?\.fullName \|\| null\}/, 'App.tsx must bind userName from reactive state');

    // Navigation, auth, and logout handlers wired
    assert.match(content, /onNavigate=\{handleNavigate\}/, 'App.tsx must wire handleNavigate');
    assert.match(content, /onLogout=\{handleLogout\}/, 'App.tsx must wire handleLogout');
    assert.match(content, /LoginModal/, 'App.tsx must include LoginModal component');
  });

  await t.test('LoginModal provides quick-fill demo buttons and authentication contracts', () => {
    const modalPath = path.join(clientRoot, 'src', 'components', 'auth', 'LoginModal.tsx');
    assert.strictEqual(fs.existsSync(modalPath), true, 'LoginModal.tsx must exist');
    const content = fs.readFileSync(modalPath, 'utf8');

    // Quick-fill buttons per Issue #2 Spec
    assert.match(content, /staff@singslot\.local/, 'LoginModal must provide staff quick-fill');
    assert.match(content, /customer1@singslot\.local/, 'LoginModal must provide customer quick-fill');
    assert.match(content, /Pass1234!/, 'LoginModal must fill seeded demo password');

    // API contract endpoint
    assert.match(content, /\/api\/auth\/login/, 'LoginModal must post to /api/auth/login');
  });

  await t.test('Client session lifecycle asserts storage cleanup and token validation on logout (AC-01e)', async () => {
    const appPath = path.join(clientRoot, 'src', 'App.tsx');
    const content = fs.readFileSync(appPath, 'utf8');

    // Asserts that App.tsx wires centralized session helpers
    assert.match(content, /clearClientSession\(\)/, 'App.tsx must invoke clearClientSession on logout');
    assert.match(content, /saveClientSession\(/, 'App.tsx must invoke saveClientSession on login success');
    assert.match(content, /validateAndRestoreSession\(\)/, 'App.tsx must validate restored session with validateAndRestoreSession');

    // Import session helper functions for true runtime unit execution
    const sessionModule = await import('../src/utils/session.ts');
    const { saveClientSession, clearClientSession, getStoredSession, validateAndRestoreSession, STORAGE_KEYS } = sessionModule;

    // Create a concrete mock Storage implementation
    const store = new Map();
    const mockStorage = {
      getItem: (key) => (store.has(key) ? store.get(key) : null),
      setItem: (key, val) => store.set(key, String(val)),
      removeItem: (key) => store.delete(key),
      clear: () => store.clear()
    };

    const mockUser = {
      id: 'usr-demo-01',
      email: 'customer1@singslot.local',
      fullName: 'Alice Customer',
      role: 'CUSTOMER'
    };

    // 1. Runtime save verification
    saveClientSession('valid-jwt-token', mockUser, mockStorage);
    assert.strictEqual(mockStorage.getItem(STORAGE_KEYS.TOKEN), 'valid-jwt-token');
    assert.deepStrictEqual(JSON.parse(mockStorage.getItem(STORAGE_KEYS.USER)), mockUser);

    // 2. Runtime getStoredSession verification
    const stored = getStoredSession(mockStorage);
    assert.strictEqual(stored.token, 'valid-jwt-token');
    assert.deepStrictEqual(stored.user, mockUser);

    // 3. Runtime clearClientSession verification (Logout test)
    clearClientSession(mockStorage);
    assert.strictEqual(mockStorage.getItem(STORAGE_KEYS.TOKEN), null, 'singslot_token must be cleared from storage');
    assert.strictEqual(mockStorage.getItem(STORAGE_KEYS.USER), null, 'singslot_user must be cleared from storage');
    const afterClear = getStoredSession(mockStorage);
    assert.strictEqual(afterClear.token, null);
    assert.strictEqual(afterClear.user, null);

    // 4. Runtime validateAndRestoreSession: Purges expired session on HTTP 401
    saveClientSession('expired-token', mockUser, mockStorage);
    const mockFetch401 = async () => ({
      ok: false,
      status: 401,
      json: async () => ({ success: false, error: { code: 'UNAUTHENTICATED' } })
    });
    const purged = await validateAndRestoreSession(mockStorage, mockFetch401);
    assert.strictEqual(purged.token, null, 'Expired token must return null');
    assert.strictEqual(purged.user, null, 'Expired user must return null');
    assert.strictEqual(mockStorage.getItem(STORAGE_KEYS.TOKEN), null, 'Expired token must be purged from storage');

    // 5. Runtime validateAndRestoreSession: Restores valid session on HTTP 200
    saveClientSession('active-token', mockUser, mockStorage);
    const mockFetch200 = async () => ({
      ok: true,
      status: 200,
      json: async () => ({ success: true, user: mockUser })
    });
    const restored = await validateAndRestoreSession(mockStorage, mockFetch200);
    assert.strictEqual(restored.token, 'active-token');
    assert.deepStrictEqual(restored.user, mockUser);
  });

  await t.test('RoomCatalog and AvailabilityMatrix conform to Issue #3 contracts (F-02, F-03)', () => {
    const catalogPath = path.join(clientRoot, 'src', 'components', 'room', 'RoomCatalog.tsx');
    assert.strictEqual(fs.existsSync(catalogPath), true, 'RoomCatalog.tsx must exist');
    const catalogContent = fs.readFileSync(catalogPath, 'utf8');
    assert.match(catalogContent, /Room Fleet Catalog/, 'RoomCatalog must render catalog title');
    assert.match(catalogContent, /capacity/, 'RoomCatalog must display capacity info');

    const matrixPath = path.join(clientRoot, 'src', 'components', 'room', 'AvailabilityMatrix.tsx');
    assert.strictEqual(fs.existsSync(matrixPath), true, 'AvailabilityMatrix.tsx must exist');
    const matrixContent = fs.readFileSync(matrixPath, 'utf8');
    assert.match(matrixContent, /Availability Matrix/, 'AvailabilityMatrix must render title');
    assert.match(matrixContent, /Available/, 'AvailabilityMatrix must indicate Available status');
    assert.match(matrixContent, /Occupied/, 'AvailabilityMatrix must indicate Occupied status');
    assert.match(matrixContent, /isPastBangkokDate/, 'AvailabilityMatrix must check past dates via Asia/Bangkok utility');
  });

  await t.test('BookingModal conforms to Issue #4 contracts (F-04, AC-04a)', () => {
    const modalPath = path.join(clientRoot, 'src', 'components', 'booking', 'BookingModal.tsx');
    assert.strictEqual(fs.existsSync(modalPath), true, 'BookingModal.tsx must exist');
    const modalContent = fs.readFileSync(modalPath, 'utf8');

    // API contract and validations
    assert.match(modalContent, /\/api\/bookings\/online/, 'BookingModal must post to /api/bookings/online');
    assert.match(modalContent, /durationHours/, 'BookingModal must bind durationHours');
    assert.match(modalContent, /partySize/, 'BookingModal must bind partySize');
    assert.match(modalContent, /isPastBangkokDate/, 'BookingModal must validate past dates via Asia/Bangkok utility');

    // App.tsx wiring verification
    const appPath = path.join(clientRoot, 'src', 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf8');
    assert.match(appContent, /BookingModal/, 'App.tsx must include BookingModal component');
    assert.match(appContent, /isBookingOpen/, 'App.tsx must manage isBookingOpen reactive state');
  });

  await t.test('Date utility formats and evaluates Asia/Bangkok dates consistently', async () => {
    const dateUtilPath = path.join(clientRoot, 'src', 'utils', 'date.ts');
    assert.strictEqual(fs.existsSync(dateUtilPath), true, 'client/src/utils/date.ts must exist');

    const dateContent = fs.readFileSync(dateUtilPath, 'utf8');
    assert.match(dateContent, /Asia\/Bangkok/, 'Date utility must use Asia/Bangkok timezone');
    assert.match(dateContent, /getBangkokTodayString/, 'Must export getBangkokTodayString');
    assert.match(dateContent, /isPastBangkokDate/, 'Must export isPastBangkokDate');
    assert.match(dateContent, /isPastBangkokSlot/, 'Must export isPastBangkokSlot');
  });

  await t.test('GlassCard and PageHeader conform to design system spec', () => {
    const cardPath = path.join(clientRoot, 'src', 'components', 'layout', 'GlassCard.tsx');
    const cardContent = fs.readFileSync(cardPath, 'utf8');
    assert.match(cardContent, /backdrop-blur/, 'GlassCard must use backdrop-blur glassmorphic styling');
    assert.match(cardContent, /export const GlassCard/, 'GlassCard must be an exported React component');

    const headerPath = path.join(clientRoot, 'src', 'components', 'layout', 'PageHeader.tsx');
    const headerContent = fs.readFileSync(headerPath, 'utf8');
    assert.match(headerContent, /export const PageHeader/, 'PageHeader must be an exported React component');
    assert.match(headerContent, /title/, 'PageHeader must accept title prop');
  });

  await t.test('Booking Views and Detail Modal conform to Issue #6 contracts (F-05, F-06)', () => {
    // MyBookingsView verification (F-05, AC-05)
    const myBookingsPath = path.join(clientRoot, 'src', 'components', 'booking', 'MyBookingsView.tsx');
    assert.strictEqual(fs.existsSync(myBookingsPath), true, 'MyBookingsView.tsx must exist');
    const myBookingsContent = fs.readFileSync(myBookingsPath, 'utf8');
    assert.match(myBookingsContent, /\/api\/bookings\/my/, 'MyBookingsView must query /api/bookings/my');
    assert.match(myBookingsContent, /bookingCode/, 'MyBookingsView must render bookingCode');

    // BookingDetailModal verification (F-05, AC-05b)
    const detailModalPath = path.join(clientRoot, 'src', 'components', 'booking', 'BookingDetailModal.tsx');
    assert.strictEqual(fs.existsSync(detailModalPath), true, 'BookingDetailModal.tsx must exist');
    const detailModalContent = fs.readFileSync(detailModalPath, 'utf8');
    assert.match(detailModalContent, /\/api\/bookings\/\$\{bookingId\}/, 'BookingDetailModal must query /api/bookings/:id');

    // StaffMasterScheduleView verification (F-06, AC-06)
    const staffSchedulePath = path.join(clientRoot, 'src', 'components', 'staff', 'StaffMasterScheduleView.tsx');
    assert.strictEqual(fs.existsSync(staffSchedulePath), true, 'StaffMasterScheduleView.tsx must exist');
    const staffScheduleContent = fs.readFileSync(staffSchedulePath, 'utf8');
    assert.match(staffScheduleContent, /\/api\/bookings\/master\?date=/, 'StaffMasterScheduleView must query /api/bookings/master?date=');

    // App.tsx wiring verification
    const appPath = path.join(clientRoot, 'src', 'App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf8');
    assert.match(appContent, /MyBookingsView/, 'App.tsx must include MyBookingsView component');
    assert.match(appContent, /StaffMasterScheduleView/, 'App.tsx must include StaffMasterScheduleView component');
    assert.match(appContent, /BookingDetailModal/, 'App.tsx must include BookingDetailModal component');
  });

  await t.test('HTML Entry Point and Root Shell configured properly', () => {
    const htmlPath = path.join(clientRoot, 'index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    assert.match(htmlContent, /id="root"/, 'index.html must include root mount element');
    assert.match(htmlContent, /src="\/src\/main\.tsx"/, 'index.html must point to entry script');
  });
});
