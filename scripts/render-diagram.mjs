import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUTPUT_DIR = path.resolve('docs/screenshots/sprint-1');
const OUTPUT_IMAGE = path.join(OUTPUT_DIR, 'architecture_diagram.png');

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>SingSlot System Architecture</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: #0b0f19;
      color: #f1f5f9;
      margin: 0;
      padding: 32px;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      box-sizing: border-box;
    }
    .mono {
      font-family: 'JetBrains Mono', monospace;
    }
    .card-border {
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(17, 24, 39, 0.7);
      backdrop-filter: blur(12px);
    }
    .arrow-down {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin: 8px 0;
      position: relative;
    }
    .arrow-line {
      width: 2px;
      height: 24px;
      background: linear-gradient(180deg, #a855f7, #38bdf8);
    }
    .arrow-head {
      width: 0;
      height: 0;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-top: 6px solid #38bdf8;
    }
  </style>
</head>
<body>
  <div style="width: 1060px;" class="flex flex-col gap-5">
    
    <!-- Title Header -->
    <div class="flex items-center justify-between pb-2 border-b border-slate-800">
      <div>
        <div class="flex items-center gap-2">
          <span class="text-xs font-black uppercase tracking-widest text-purple-400 bg-purple-950/70 border border-purple-800/60 px-2.5 py-0.5 rounded-full">System Architecture</span>
          <span class="text-xs font-bold text-slate-500">Deliverable 1 • Spring 2026</span>
        </div>
        <h1 class="text-2xl font-black tracking-tight text-white mt-1">SingSlot — Full-Stack Modular Monolith Architecture</h1>
      </div>
      <div class="flex items-center gap-2">
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-slate-800/80 border border-slate-700 text-slate-300">
          <span class="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          Authoritative Production Baseline
        </span>
      </div>
    </div>

    <!-- LAYER 1: CLIENT PRESENTATION LAYER -->
    <div class="rounded-2xl border border-sky-500/30 bg-slate-900/80 p-5 shadow-xl relative">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2.5">
          <div class="h-7 w-7 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 font-black text-xs">L1</div>
          <h2 class="text-sm font-extrabold tracking-wide uppercase text-sky-300">Client Presentation Layer</h2>
        </div>
        <div class="flex items-center gap-2">
          <span class="mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-sky-950 border border-sky-500/50 text-sky-300 shadow-sm">Port 3000</span>
          <span class="text-[11px] font-semibold text-slate-400">Vite Dev Server & Production Bundle</span>
        </div>
      </div>

      <!-- Tech Badge -->
      <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 mb-3 text-center">
        <div class="text-xs font-bold text-slate-200">
          <span class="text-sky-400 font-extrabold">React 18 + TypeScript + Vite SPA</span>
          <span class="text-slate-500 mx-2">•</span>
          <span class="text-purple-300">Tailwind CSS (Pastel Cosmic Theme)</span>
          <span class="text-slate-500 mx-2">•</span>
          <span class="text-pink-300">Lucide React Icons</span>
        </div>
      </div>

      <!-- Shared Layout Shell -->
      <div class="rounded-xl border border-purple-500/30 bg-purple-950/20 p-3 mb-3 text-center">
        <span class="text-[10px] font-extrabold uppercase tracking-wider text-purple-400">Centralized Design System Shell</span>
        <div class="text-xs font-bold text-purple-200 mt-0.5">
          <code class="text-white bg-purple-900/50 px-2 py-0.5 rounded border border-purple-700/50">AppLayout.tsx</code> &nbsp;•&nbsp; 
          <code class="text-white bg-purple-900/50 px-2 py-0.5 rounded border border-purple-700/50">PageHeader.tsx</code> &nbsp;•&nbsp; 
          <code class="text-white bg-purple-900/50 px-2 py-0.5 rounded border border-purple-700/50">GlassCard.tsx</code> &nbsp;•&nbsp; 
          <code class="text-white bg-purple-900/50 px-2 py-0.5 rounded border border-purple-700/50">DatePicker.tsx</code>
        </div>
      </div>

      <!-- Customer vs Staff Slices Grid -->
      <div class="grid grid-cols-2 gap-3">
        <!-- Customer Slice -->
        <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div class="flex items-center justify-between pb-1.5 border-b border-slate-800/80 mb-2">
            <span class="text-xs font-extrabold text-pink-300 flex items-center gap-1.5">
              <span class="h-1.5 w-1.5 rounded-full bg-pink-400"></span> Customer Views
            </span>
            <span class="text-[10px] font-bold text-slate-500 mono">Role: CUSTOMER</span>
          </div>
          <ul class="text-xs text-slate-300 space-y-1">
            <li class="flex items-center gap-1.5">
              <span class="text-slate-600">▹</span>
              <span class="font-semibold text-slate-200">Room Fleet Catalog</span>
              <span class="text-[10px] text-slate-400">(9 rooms: Small, Med, Large)</span>
            </li>
            <li class="flex items-center gap-1.5">
              <span class="text-slate-600">▹</span>
              <span class="font-semibold text-slate-200">Live Availability Matrix</span>
              <span class="text-[10px] text-emerald-400">(14 Slots, 10:00–24:00)</span>
            </li>
            <li class="flex items-center gap-1.5">
              <span class="text-slate-600">▹</span>
              <span class="font-semibold text-slate-200">Online Reservation Modal</span>
              <span class="text-[10px] text-purple-400">(1–5 contiguous hours)</span>
            </li>
            <li class="flex items-center gap-1.5">
              <span class="text-slate-600">▹</span>
              <span class="font-semibold text-slate-200">My Reservations ("My Bookings")</span>
              <span class="text-[10px] text-slate-400">(Private History)</span>
            </li>
          </ul>
        </div>

        <!-- Staff Slice -->
        <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div class="flex items-center justify-between pb-1.5 border-b border-slate-800/80 mb-2">
            <span class="text-xs font-extrabold text-purple-300 flex items-center gap-1.5">
              <span class="h-1.5 w-1.5 rounded-full bg-purple-400"></span> Staff Manager Console
            </span>
            <span class="text-[10px] font-bold text-purple-400 mono">Role: STAFF</span>
          </div>
          <ul class="text-xs text-slate-300 space-y-1">
            <li class="flex items-center gap-1.5">
              <span class="text-slate-600">▹</span>
              <span class="font-semibold text-slate-200">Master Schedule Matrix</span>
              <span class="text-[10px] text-purple-400">(9 Rooms x 14 Slots Global Grid)</span>
            </li>
            <li class="flex items-center gap-1.5">
              <span class="text-slate-600">▹</span>
              <span class="font-semibold text-slate-200">Continuous Multi-Hour Booking Blocks</span>
              <span class="text-[10px] text-slate-400">(Unbroken Visual Bars)</span>
            </li>
            <li class="flex items-center gap-1.5">
              <span class="text-slate-600">▹</span>
              <span class="font-semibold text-slate-200">Reservation Detail Voucher Modal</span>
              <span class="text-[10px] text-slate-400">(Staff Inspection Override)</span>
            </li>
            <li class="flex items-center gap-1.5">
              <span class="text-slate-600">▹</span>
              <span class="font-semibold text-slate-200">Daily Fleet Utilization Overview</span>
              <span class="text-[10px] text-emerald-400">(Booking Stats & KPI Cards)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- ARROW 1 -> 2 -->
    <div class="arrow-down">
      <div class="arrow-line"></div>
      <div class="arrow-head"></div>
      <div class="mt-1 px-3 py-0.5 rounded-full bg-slate-800/90 border border-slate-700/80 text-[10px] font-bold text-slate-300 flex items-center gap-2">
        <span>Vite Reverse Proxy <code class="text-sky-300">/api</code></span>
        <span class="text-slate-500">➔</span>
        <span>Stateless RESTful JSON</span>
        <span class="text-slate-500">•</span>
        <span class="text-purple-300">Bearer JWT Claims</span>
        <span class="text-slate-500">•</span>
        <span class="text-slate-400">Asia/Bangkok (UTC+7)</span>
      </div>
    </div>

    <!-- LAYER 2: API & APPLICATION LAYER -->
    <div class="rounded-2xl border border-purple-500/30 bg-slate-900/80 p-5 shadow-xl relative">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2.5">
          <div class="h-7 w-7 rounded-lg bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-400 font-black text-xs">L2</div>
          <h2 class="text-sm font-extrabold tracking-wide uppercase text-purple-300">API & Application Layer</h2>
        </div>
        <div class="flex items-center gap-2">
          <span class="mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-purple-950 border border-purple-500/50 text-purple-300 shadow-sm">Port 5001</span>
          <span class="text-[11px] font-semibold text-slate-400">Node.js + Express.js REST API</span>
        </div>
      </div>

      <!-- Express Routers -->
      <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-2.5 mb-3">
        <div class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Express Routers & Endpoints</div>
        <div class="flex flex-wrap gap-2 mono text-xs">
          <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300"><span class="text-purple-400 font-bold">POST</span> /api/auth/login</span>
          <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300"><span class="text-purple-400 font-bold">GET</span> /api/auth/me</span>
          <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300"><span class="text-sky-400 font-bold">GET</span> /api/rooms</span>
          <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300"><span class="text-sky-400 font-bold">GET</span> /api/availability</span>
          <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300"><span class="text-emerald-400 font-bold">POST</span> /api/bookings/online</span>
          <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300"><span class="text-emerald-400 font-bold">GET</span> /api/bookings/my</span>
          <span class="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300"><span class="text-emerald-400 font-bold">GET</span> /api/bookings/:id</span>
          <span class="px-2 py-0.5 rounded bg-slate-900 border border-purple-800 text-purple-200"><span class="text-purple-400 font-bold">GET</span> /api/bookings/master</span>
        </div>
      </div>

      <!-- Security Middlewares & Domain Validation Pipes -->
      <div class="grid grid-cols-2 gap-3 mb-3">
        <!-- Security & Auth Middlewares -->
        <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div class="text-[10px] font-extrabold uppercase tracking-wider text-purple-400 mb-2">Security & RBAC Middlewares</div>
          <div class="space-y-1.5 text-xs">
            <div class="p-1.5 rounded bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <span class="font-bold text-slate-200">verifyToken</span>
              <span class="text-[10px] text-purple-400 mono">HMAC-SHA256 Fail-Fast</span>
            </div>
            <div class="p-1.5 rounded bg-slate-900/90 border border-slate-800 flex items-center justify-between">
              <span class="font-bold text-slate-200">requireRole</span>
              <span class="text-[10px] text-pink-400 mono">CUSTOMER vs STAFF Guard</span>
            </div>
          </div>
        </div>

        <!-- Domain Validation Pipes -->
        <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div class="text-[10px] font-extrabold uppercase tracking-wider text-sky-400 mb-2">Domain Business Rule Validation Pipes</div>
          <div class="grid grid-cols-2 gap-1.5 text-[11px]">
            <div class="p-1 rounded bg-slate-900/90 border border-slate-800">
              <span class="text-slate-400">BR-05:</span> <span class="font-bold text-slate-200">Capacity (4, 8, 12)</span>
            </div>
            <div class="p-1 rounded bg-slate-900/90 border border-slate-800">
              <span class="text-slate-400">BR-03:</span> <span class="font-bold text-slate-200">Slots 0..13 (10:00–24:00)</span>
            </div>
            <div class="p-1 rounded bg-slate-900/90 border border-slate-800">
              <span class="text-slate-400">BR-01:</span> <span class="font-bold text-slate-200">Contiguous 1–5 Hours</span>
            </div>
            <div class="p-1 rounded bg-slate-900/90 border border-slate-800">
              <span class="text-slate-400">BR-04:</span> <span class="font-bold text-slate-200">Past Slot Bangkok Guard</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Controllers & Services Grid -->
      <div class="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
        <div class="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">Controllers & Core Services</div>
        <div class="grid grid-cols-3 gap-2 text-xs">
          <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
            <div class="font-bold text-emerald-300 mono text-[11px]">booking.controller.ts</div>
            <div class="text-[10px] text-slate-400 mt-0.5">ACID Booking Engine, Conflict Prevention & Slot Allocation</div>
          </div>
          <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
            <div class="font-bold text-purple-300 mono text-[11px]">auth.controller.ts</div>
            <div class="text-[10px] text-slate-400 mt-0.5">bcrypt Hash Verification, Signed JWT Token Minting & Session</div>
          </div>
          <div class="p-2 rounded-lg bg-slate-900 border border-slate-800">
            <div class="font-bold text-sky-300 mono text-[11px]">availability.controller.ts</div>
            <div class="text-[10px] text-slate-400 mt-0.5">O(1) Set Occupancy Calculation & Elapsed Bangkok Slot Check</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ARROW 2 -> 3 -->
    <div class="arrow-down">
      <div class="arrow-line"></div>
      <div class="arrow-head"></div>
      <div class="mt-1 px-3 py-0.5 rounded-full bg-slate-800/90 border border-slate-700/80 text-[10px] font-bold text-slate-300 flex items-center gap-2">
        <span>Prisma Client (v5.22.0)</span>
        <span class="text-slate-500">➔</span>
        <span class="text-emerald-400 font-bold">prisma.$transaction</span>
        <span class="text-slate-400">(ACID Atomic Row-Level Isolation)</span>
        <span class="text-slate-500">•</span>
        <span class="text-sky-300">Native Connection Pool</span>
      </div>
    </div>

    <!-- LAYER 3: PERSISTENCE DATA LAYER -->
    <div class="rounded-2xl border border-emerald-500/30 bg-slate-900/80 p-5 shadow-xl relative">
      <div class="flex items-center justify-between mb-3">
        <div class="flex items-center gap-2.5">
          <div class="h-7 w-7 rounded-lg bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 font-black text-xs">L3</div>
          <h2 class="text-sm font-extrabold tracking-wide uppercase text-emerald-300">Persistence Data Layer</h2>
        </div>
        <div class="flex items-center gap-2">
          <span class="mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-emerald-950 border border-emerald-500/50 text-emerald-300 shadow-sm">Port 5432</span>
          <span class="text-[11px] font-semibold text-slate-400">PostgreSQL (Database: <code class="text-emerald-300">singslot_dev</code>)</span>
        </div>
      </div>

      <!-- Relational Schema Cards Grid (5 Tables) -->
      <div class="grid grid-cols-5 gap-2.5 text-xs">
        
        <!-- Table 1: users -->
        <div class="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between pb-1 border-b border-slate-800 mb-1.5">
              <span class="font-black text-white mono text-[11px]">users</span>
              <span class="text-[9px] font-extrabold text-slate-500">REL</span>
            </div>
            <ul class="text-[10px] space-y-0.5 text-slate-400 mono">
              <li><span class="text-amber-400 font-bold">PK</span> id (UUID)</li>
              <li><span class="text-sky-400 font-bold">UK</span> email</li>
              <li>passwordHash</li>
              <li>fullName, phone</li>
              <li>role (Role ENUM)</li>
            </ul>
          </div>
          <div class="mt-2 pt-1 border-t border-slate-900 text-[9px] text-slate-500">Seeded Demo Users</div>
        </div>

        <!-- Table 2: rooms -->
        <div class="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between pb-1 border-b border-slate-800 mb-1.5">
              <span class="font-black text-white mono text-[11px]">rooms</span>
              <span class="text-[9px] font-extrabold text-slate-500">REL</span>
            </div>
            <ul class="text-[10px] space-y-0.5 text-slate-400 mono">
              <li><span class="text-amber-400 font-bold">PK</span> id (UUID)</li>
              <li><span class="text-sky-400 font-bold">UK</span> roomNumber</li>
              <li>type (RoomType)</li>
              <li>capacity (4..12)</li>
              <li>description</li>
              <li>isActive</li>
            </ul>
          </div>
          <div class="mt-2 pt-1 border-t border-slate-900 text-[9px] text-sky-400 font-semibold">9 Fleet Suites</div>
        </div>

        <!-- Table 3: bookings -->
        <div class="rounded-xl border border-emerald-800/40 bg-emerald-950/10 p-2.5 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between pb-1 border-b border-emerald-900/50 mb-1.5">
              <span class="font-black text-emerald-300 mono text-[11px]">bookings</span>
              <span class="text-[9px] font-extrabold text-emerald-400">CORE</span>
            </div>
            <ul class="text-[10px] space-y-0.5 text-slate-400 mono">
              <li><span class="text-amber-400 font-bold">PK</span> id (UUID)</li>
              <li><span class="text-sky-400 font-bold">UK</span> bookingCode</li>
              <li><span class="text-purple-400">FK</span> userId, roomId</li>
              <li>bookingDate</li>
              <li>startSlot, duration</li>
              <li>partySize, status</li>
            </ul>
          </div>
          <div class="mt-2 pt-1 border-t border-slate-900 text-[9px] text-emerald-400 font-semibold">Master Vouchers</div>
        </div>

        <!-- Table 4: booking_slots -->
        <div class="rounded-xl border border-purple-800/50 bg-purple-950/15 p-2.5 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between pb-1 border-b border-purple-900/50 mb-1.5">
              <span class="font-black text-purple-300 mono text-[11px]">booking_slots</span>
              <span class="text-[9px] font-extrabold text-purple-400">LOCK</span>
            </div>
            <ul class="text-[10px] space-y-0.5 text-slate-400 mono">
              <li><span class="text-amber-400 font-bold">PK</span> id (UUID)</li>
              <li><span class="text-purple-400">FK</span> bookingId</li>
              <li><span class="text-purple-400">FK</span> roomId</li>
              <li>bookingDate</li>
              <li>slotIndex (0..13)</li>
            </ul>
          </div>
          <div class="mt-2 pt-1 border-t border-purple-900/40 text-[9px] text-purple-300 font-bold leading-tight">
            @@unique([roomId, bookingDate, slotIndex])
          </div>
        </div>

        <!-- Table 5: room_blocks -->
        <div class="rounded-xl border border-slate-800 bg-slate-950/70 p-2.5 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between pb-1 border-b border-slate-800 mb-1.5">
              <span class="font-black text-white mono text-[11px]">room_blocks</span>
              <span class="text-[9px] font-extrabold text-slate-500">BLOCK</span>
            </div>
            <ul class="text-[10px] space-y-0.5 text-slate-400 mono">
              <li><span class="text-amber-400 font-bold">PK</span> id (UUID)</li>
              <li><span class="text-purple-400">FK</span> roomId</li>
              <li>blockDate</li>
              <li>slotIndex (0..13)</li>
              <li>reason</li>
            </ul>
          </div>
          <div class="mt-2 pt-1 border-t border-slate-900 text-[9px] text-slate-400 font-bold leading-tight">
            @@unique([roomId, blockDate, slotIndex])
          </div>
        </div>

      </div>
    </div>

  </div>
</body>
</html>`;

const tempHtmlPath = path.resolve('docs/sprints/sprint-1/architecture_diagram.html');
fs.writeFileSync(tempHtmlPath, htmlContent);

async function run() {
  console.log('Rendering High-Res Architecture Diagram via Chrome Headless...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1140, height: 1100, deviceScaleFactor: 2 });
  await page.goto('file://' + tempHtmlPath, { waitUntil: 'networkidle0' });
  await new Promise(r => setTimeout(r, 600));

  await page.screenshot({ path: OUTPUT_IMAGE, fullPage: true });
  console.log('✅ Successfully rendered:', OUTPUT_IMAGE);

  await browser.close();
}

run().catch(err => {
  console.error('Error rendering diagram:', err);
  process.exit(1);
});
