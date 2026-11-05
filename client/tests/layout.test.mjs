import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientRoot = path.resolve(__dirname, '..');

test('Client Layout & UI Component Baseline Verification', async (t) => {
  await t.test('Layout components exist in client/src/components/layout/', () => {
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

  await t.test('AppLayout provides unified navigation and placeholder contracts', () => {
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

  await t.test('HTML Entry Point and Root Shell configured properly', () => {
    const htmlPath = path.join(clientRoot, 'index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    assert.match(htmlContent, /id="root"/, 'index.html must include root mount element');
    assert.match(htmlContent, /src="\/src\/main\.tsx"/, 'index.html must point to entry script');
  });
});
