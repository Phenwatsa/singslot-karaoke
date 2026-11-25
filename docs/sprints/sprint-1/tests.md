# Sprint 1 Authoritative Test Execution Logs & Verification Evidence
## Project: SingSlot — Karaoke Room Reservation & Management System
**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents  
**Target:** Deliverable 1 (Sprint 1 Lean Delivery — The Golden Online Booking Slice)  
**Document Status:** Approved & Authoritative (Sprint 1 Baseline §1–§7 Preserved; Lab 7 Planned STS Appended in §8)  
**Last Updated:** 2026-11-05 (Sprint 1 Baseline Logs) / 2026-11-25 (Lab 7 §8 Pre-Implementation STS)  

---

## 1. Acceptance Criteria Traceability Matrix (Issue #1)

| AC ID | Requirement / Scope | Target Component / File | Verification Method | Status |
|---|---|---|---|---|
| **AC-01** | Clean checkout dependency installation | Root `package.json`, `package-lock.json` | `npm ci` execution from clean checkout | **PASS** |
| **AC-02** | Type safety & production build | `client/`, `server/` (TypeScript configs) | `npm run typecheck && npm run build` | **PASS** |
| **AC-03** | PostgreSQL migration from empty DB | `server/prisma/migrations/20261105000000_init/` | `npm run prisma:migrate` on empty DB | **PASS** |
| **AC-04** | Seed dataset provision | `server/prisma/seed.ts` | 3 users & 9 rooms populated with bcrypt hashes | **PASS** |
| **AC-05** | Seed idempotency & hash preservation | `server/prisma/seed.ts` | 2 consecutive seed runs; hash unchanged | **PASS** |
| **AC-06** | Unique constraints enforcement | `server/prisma/schema.prisma`, `migration.sql` | `server/tests/baseline.test.ts` static assertions | **PASS** |
| **AC-07** | Shared layout shell in unauthenticated state | `client/src/App.tsx`, `client/src/components/layout/` | `client/tests/layout.test.mjs` structural smoke test | **PASS** |
| **AC-08** | Serial execution (M1 8GB RAM safe) | Root scripts, Jest `--runInBand` & Node `--test-concurrency=1` | Single-worker serial execution (<1.5s total) | **PASS** |

---

## 2. AC-01: Deterministic Dependency Installation (`npm ci`)

Raw terminal execution proving clean install via root `package-lock.json`:

```bash
$ npm ci
npm warn deprecated inflight@1.0.6: This module is not supported, and leaks memory.
npm warn deprecated rimraf@2.7.1: Rimraf versions prior to v4 are no longer supported
npm warn deprecated glob@7.2.3: Old versions of glob are not supported.

added 558 packages, and audited 561 packages in 4s

74 packages are looking for funding
  run `npm fund` for details

9 vulnerabilities (7 low, 1 moderate, 1 high)

✔ Exited with code 0
```

---

## 3. AC-02: Typecheck & Production Build Compilation

Raw terminal execution proving zero TypeScript diagnostic errors and successful production artifact compilation across both workspaces:

```bash
$ npm run typecheck
> singslot-karaoke@1.0.0 typecheck
> npm --prefix server run typecheck && npm --prefix client run typecheck

> singslot-server@1.0.0 typecheck
> tsc --noEmit

> singslot-client@1.0.0 typecheck
> tsc --noEmit
✔ Exited with code 0 (Zero type errors)

$ npm run build
> singslot-karaoke@1.0.0 build
> npm run build:server && npm run build:client

> singslot-karaoke@1.0.0 build:server
> npm --prefix server run build

> singslot-server@1.0.0 build
> tsc

> singslot-karaoke@1.0.0 build:client
> npm --prefix client run build

> singslot-client@1.0.0 build
> tsc -b && vite build

vite v5.4.21 building for production...
✓ 1574 modules transformed.
dist/index.html                   0.57 kB │ gzip:  0.37 kB
dist/assets/index-M7RLpZWb.css   16.58 kB │ gzip:  3.83 kB
dist/assets/index-Cb16Iyf6.js   155.95 kB │ gzip: 49.67 kB
✓ built in 1.14s
✔ Exited with code 0
```

---

## 4. AC-06, AC-07, AC-08: Automated Test Suites Execution (`npm test`)

Raw serial in-band test runner output verifying all 11 automated test specifications:

```bash
$ npm test
> singslot-karaoke@1.0.0 test
> npm run test:server && npm run test:client

> singslot-karaoke@1.0.0 test:server
> npm --prefix server test

> singslot-server@1.0.0 test
> jest --runInBand --detectOpenHandles --forceExit

PASS tests/baseline.test.ts
  Baseline System Health & API Envelope
    ✓ GET /api/health returns HTTP 200 with standard envelope (37 ms)
    ✓ Unknown route returns HTTP 404 with standard error envelope (7 ms)
  Database Schema & Migration DDL Contract Integrity (Static Analysis)
    ✓ schema.prisma declares composite unique constraints for slot isolation and unique bookingCode (1 ms)
    ✓ migration.sql contains PostgreSQL DDL for composite constraints and unique bookingCode (1 ms)
    ✓ seed.ts implements true idempotency without password overwrite (1 ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
Snapshots:   0 total
Time:        0.948 s

> singslot-karaoke@1.0.0 test:client
> npm --prefix client test

> singslot-client@1.0.0 test
> node --test --test-concurrency=1 tests/layout.test.mjs

▶ Client Layout & UI Component Structural Verification (AC-07)
  ✔ Layout template files exist in client/src/components/layout/ (0.5ms)
  ✔ AppLayout declares navigation contracts and placeholder hooks (1.1ms)
  ✔ App.tsx initializes in unauthenticated state with wired navigation callbacks (0.4ms)
  ✔ GlassCard and PageHeader conform to design system spec (0.7ms)
  ✔ HTML Entry Point and Root Shell configured properly (0.2ms)
✔ Client Layout & UI Component Structural Verification (AC-07) (4.0ms)
ℹ tests 6
ℹ suites 0
ℹ pass 6
ℹ fail 0

Total Tests: 11 passed, 0 failed (100% pass rate)
```

### Static Assertion Details for AC-06 (`server/tests/baseline.test.ts`)
The test explicitly validates:
1. `bookingCode String @unique` on `Booking` model in `schema.prisma`.
2. `CREATE UNIQUE INDEX "bookings_bookingCode_key" ON "bookings"("bookingCode");` in `migration.sql`.
3. `@@unique([roomId, bookingDate, slotIndex])` on `BookingSlot` in `schema.prisma` and unique index in `migration.sql`.
4. `@@unique([roomId, blockDate, slotIndex])` on `RoomBlock` in `schema.prisma` and unique index in `migration.sql`.

---

## 5. AC-03: PostgreSQL Database Migration from Clean Database

Step-by-step verification demonstrating migration execution from an empty database instance:

### Step 5.1: Confirm Empty Database Instance
```sql
psql -d singslot_dev -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';"

 count 
-------
     0
(1 row)
```

### Step 5.2: Apply Committed Prisma Migration
```bash
$ npm run prisma:migrate
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "singslot_dev", schema "public" at "localhost:5432"

Applying migration `20261105000000_init`

The following migration(s) have been applied:

migrations/
  └─ 20261105000000_init/
    └─ migration.sql

Your database is now in sync with your schema.
✔ Generated Prisma Client (v5.22.0)
```

### Step 5.3: Verify Relations Created After Migration
```sql
psql -d singslot_dev -c "\dt"

                     List of relations
 Schema |        Name        | Type  |        Owner        
--------+--------------------+-------+---------------------
 public | _prisma_migrations | table | penwatsasaengyenpan
 public | booking_slots      | table | penwatsasaengyenpan
 public | bookings           | table | penwatsasaengyenpan
 public | room_blocks        | table | penwatsasaengyenpan
 public | rooms              | table | penwatsasaengyenpan
 public | users              | table | penwatsasaengyenpan
(6 rows)
```

---

## 6. AC-04 & AC-05: Verifiable Seed Idempotency & Hash Preservation

Proof of idempotent data provisioning across two consecutive runs:

### Step 6.1: First Seed Run Output
```bash
$ npm run prisma:seed
🌱 Starting SingSlot database seeding (Idempotent)...
✅ Seeded/Verified 3 demo users (1 Staff, 2 Customers).
✅ Seeded/Verified 9 karaoke rooms (3 Small, 3 Medium, 3 Large).
🎉 Idempotent seeding completed successfully!
```

### Step 6.2: Database Query Output after Run 1 (Full Hash & Checksum)
```sql
psql -d singslot_dev -c "SELECT email, role, \"passwordHash\", md5(\"passwordHash\") AS hash_md5 FROM users ORDER BY email;"

          email           |   role   |                         passwordHash                         |             hash_md5             
--------------------------+----------+--------------------------------------------------------------+----------------------------------
 customer1@singslot.local | CUSTOMER | $2a$10$pvTMdZ3CJ/pWf/wXenVoy.UCg33NMLQCJCsmYIKVzr172n7dn3b7i | b1f25fec10ff7b7f20b7ac3fe630628a
 customer2@singslot.local | CUSTOMER | $2a$10$cyD/6GfAFNRitmTEVlQThOvAcBo.cb0Wr7w5/ov0Ax17O8QEmQQjm | 5383de889f81f5bb42fd97eb4fc4af63
 staff@singslot.local     | STAFF    | $2a$10$f.qPra.ZKtbHi3kObIjGqOHf7cRmVCQIjHyYb8s6zh7eXJTj7X75a | 3150cc9ba69507e3e93c1a0220849b5c
(3 rows)

psql -d singslot_dev -c "SELECT count(*) FROM rooms;"
 count: 9
```

### Step 6.3: Second Seed Run Output (Idempotency Test)
```bash
$ npm run prisma:seed
🌱 Starting SingSlot database seeding (Idempotent)...
✅ Seeded/Verified 3 demo users (1 Staff, 2 Customers).
✅ Seeded/Verified 9 karaoke rooms (3 Small, 3 Medium, 3 Large).
🎉 Idempotent seeding completed successfully!
```

### Step 6.4: Database Query Output after Run 2 (Full Hash & Checksum Comparison)
```sql
psql -d singslot_dev -c "SELECT email, role, \"passwordHash\", md5(\"passwordHash\") AS hash_md5 FROM users ORDER BY email;"

          email           |   role   |                         passwordHash                         |             hash_md5             
--------------------------+----------+--------------------------------------------------------------+----------------------------------
 customer1@singslot.local | CUSTOMER | $2a$10$pvTMdZ3CJ/pWf/wXenVoy.UCg33NMLQCJCsmYIKVzr172n7dn3b7i | b1f25fec10ff7b7f20b7ac3fe630628a
 customer2@singslot.local | CUSTOMER | $2a$10$cyD/6GfAFNRitmTEVlQThOvAcBo.cb0Wr7w5/ov0Ax17O8QEmQQjm | 5383de889f81f5bb42fd97eb4fc4af63
 staff@singslot.local     | STAFF    | $2a$10$f.qPra.ZKtbHi3kObIjGqOHf7cRmVCQIjHyYb8s6zh7eXJTj7X75a | 3150cc9ba69507e3e93c1a0220849b5c
(3 rows)

psql -d singslot_dev -c "SELECT count(*) FROM rooms;"
 count: 9
```

**Conclusion:** Zero duplicate records created; exactly 3 users and 9 rooms preserved; full 60-character bcrypt password hashes and MD5 checksums remain 100% identical.

---

## 7. Security Vulnerability Audit & Disclosure (`npm audit`)

As part of the Sprint 1 clean checkout verification (`npm ci`), an automated security audit was executed:

```bash
$ npm audit
9 vulnerabilities (7 low, 1 moderate, 1 high)
```

### Triage & Risk Assessment
- **High Severity (`deepmerge` prototype pollution GHSA-gcqx-w48m-w2h4):** Transitive dependency imported exclusively via `jest` ➔ `jest-cli` ➔ `jest-config` ➔ `deepmerge` in devDependencies. Used strictly for merging local Jest test configuration objects.
- **Moderate Severity (`esbuild` dev server request reflection GHSA-67mh-4wv8-2f99):** Transitive dependency of Vite dev server tooling (`vite` ➔ `esbuild`).
- **Production Impact:** **Zero runtime vulnerability.** None of these packages are bundled or included in production client or server builds (`dist/`).
- **Remediation Plan:** Running `npm audit fix --force` would introduce breaking downgrades to `jest@25` and `vite@8`. These transitive dev tool advisories are documented as non-blocking technical debt and will be tracked for clean non-breaking dependency resolution in Sprint 2.

---

## 8. Lab 7 — Revised Sprint 1 Acceptance & Test Specifications (Planned / Pre-Implementation)

> [!IMPORTANT]
> **Pre-Implementation Status Notice (2026-11-25):**
> Sections 1–7 above remain **frozen historical verification evidence** from the accepted Sprint 1 baseline (`v0.1.0-sprint1`). Section 8 defines the **Planned TDD Software Test Specifications (STS)** introduced under the Lab 7 Adaptive Maintenance contract revision (`v1.3.0`, see [`docs/labs/lab-07/change-impact.md`](../../labs/lab-07/change-impact.md) and [`docs/sprints/sprint-1/contracts.md`](./contracts.md)).
> All entries below are strictly **`PLANNED (Not Yet Executed)`** — RED (failing on pre-change code) and GREEN (passing after implementation) terminal logs will be executed and recorded separately in **Lab 7 Issue 2** (`feat/lab7-issue-2-booking-rules-pricing`).

### 8.1 Revised & New Acceptance Criteria Matrix (Lab 7 Scope)

| AC ID | Target Feature | Linked Req / BR | Scenario | Observable Expected Outcome | Execution Status |
| :--- | :---: | :--- | :--- | :--- | :---: |
| **AC-02b** | F-02 | `FR-02`, `BR-12` | Client queries `/api/rooms` and `/api/availability` for tier hourly rates | Every room returns accurate integer `hourlyRate` (`SMALL`: 200, `MEDIUM`: 350, `LARGE`: 500 THB/hr). | **PLANNED (Not Executed)** |
| **AC-03c** | F-03 | `FR-03`, `BR-04` | Client queries `/api/availability` for a slot `< 60 min` vs. `== 60 min` before start | Slot `< 60 min` away returns `isWithinCutoff: true`, `isAvailable: false`, `isPast: false` (Walk-in uses `!isOccupied && !isPast`); slot `== 60 min` away returns `isWithinCutoff: false`, `isAvailable: true` (if unoccupied). *(Preserves `AC-03b` for Sprint 2 `NFR-04`.)* | **PLANNED (Not Executed)** |
| **AC-04g** | F-04 | `FR-04`, `BR-04` | Customer submits online booking at exact 60-min boundary vs. `< 60 min` before start | Exactly 60 min prior returns HTTP `201 Created`; strictly `< 60 min` prior (e.g., 59m59s) returns HTTP `400 CANNOT_BOOK_PAST_SLOT` with zero rows modified. | **PLANNED (Not Executed)** |
| **AC-04h** | F-04 | `FR-04`, `BR-01` | Customer books online overlapping Peak Hours `18:00–22:00` (`slots 8..11`) vs. pure Off-Peak | Peak-overlapping booking of 3 hrs returns HTTP `201`; Peak-overlapping booking of 4 hrs returns HTTP `400 PEAK_DURATION_EXCEEDED`; pure Off-Peak 5-hr booking returns HTTP `201`. | **PLANNED (Not Executed)** |
| **AC-04i** | F-04 | `FR-04`, `BR-06`, `BR-11` | Customer accumulates `<= 6` vs. `> 6` `CONFIRMED` hours on the same `bookingDate` (sequential & concurrent across distinct rooms) | Cumulative `== 6` hrs returns HTTP `201`; cumulative `> 6` hrs returns HTTP `409 DAILY_QUOTA_EXCEEDED`; concurrent multi-room `4h + 4h` yields strictly one `201` and one `409`; `CANCELLED` bookings are excluded from quota. | **PLANNED (Not Executed)** |
| **AC-04j** | F-04, F-05, F-06 | `FR-04`, `FR-05`, `FR-06`, `BR-12` | Customer creates booking (including forged client `totalPrice`) and views via My Bookings, Detail, and Staff Master Schedule | Server ignores client-supplied price, persists `totalPrice = room.hourlyRate * durationHours`, and returns identical `totalPrice` across all four endpoints while preserving `BR-07`/`BR-08` access guards. | **PLANNED (Not Executed)** |

### 8.2 Planned Lab 7 Software Test Specifications (TDD Targets for Issue 2)

| Test ID | Linked AC | Level | Preconditions & Test Inputs | Test Action | Expected Result | Status |
| :--- | :---: | :--- | :--- | :--- | :--- | :---: |
| **TEST-02b** | `AC-02b` | API Integration (TDD) | Seeded PostgreSQL database with 9 rooms (`S01–S03`, `M01–M03`, `L01–L03`) after additive pricing migration (`hourlyRate`) | Call `GET /api/rooms` and `GET /api/availability?date=<futureDate>` | HTTP `200`; every `SMALL` room has `hourlyRate: 200`, `MEDIUM`: `350`, `LARGE`: `500` in both room catalog and availability payloads. | **PLANNED (TDD)** |
| **TEST-03c** | `AC-03c` | Domain Boundary (TDD) | Unoccupied Room `S01` Slot 4 (`14:00–15:00 ICT`) on `<today>`; mocked server clock at (a) `13:01:00+07:00` (59 min prior) and (b) `13:00:00+07:00` (exact 60 min prior) | Call `GET /api/availability?date=<today>` under clocks (a) and (b) | (a) Slot 4 returns `isWithinCutoff: true`, `isAvailable: false`, `isPast: false`; (b) Slot 4 returns `isWithinCutoff: false`, `isAvailable: true`, `isPast: false`. *(Preserves `TEST-03b` for Sprint 2 `NFR-04`.)* | **PLANNED (TDD)** |
| **TEST-04g** | `AC-04g` | Domain Boundary (TDD) | Authenticated `CUSTOMER` JWT (`customer1@singslot.local`), open Room `S01` Slot 4 (`14:00 ICT`); mocked server clock at (a) `13:00:00+07:00` (exact 60 min prior) and (b) `13:00:01+07:00` (59m59s prior) | `POST /api/bookings/online` (`roomId: S01`, `startSlot: 4`, `durationHours: 1`, `partySize: 2`) under (a) and (b) | (a) HTTP `201 Created`; (b) HTTP `400 Bad Request` with `error.code === 'CANNOT_BOOK_PAST_SLOT'` and 0 rows persisted. | **PLANNED (TDD)** |
| **TEST-04h** | `AC-04h` | Domain Boundary (TDD) | Authenticated `CUSTOMER` JWT, open rooms on future date; inputs: (a) `startSlot: 8, durationHours: 3` (Peak 3h), (b) `startSlot: 6, durationHours: 4` (straddles into Peak `8..9`), (c) `startSlot: 8, durationHours: 4` (Peak 4h), (d) `startSlot: 0, durationHours: 5` (pure Off-Peak 5h) | Submit `POST /api/bookings/online` for cases (a)–(d) | (a) HTTP `201 Created`; (b) HTTP `400 PEAK_DURATION_EXCEEDED`; (c) HTTP `400 PEAK_DURATION_EXCEEDED`; (d) HTTP `201 Created`. | **PLANNED (TDD)** |
| **TEST-04i** | `AC-04i` | Domain & Concurrency (TDD) | Authenticated `CUSTOMER` JWT on future date; (a) two sequential 3h bookings (`sum=6`), (b) additional 1h booking (`sum=7`), (c) pre-seeded 4h `CANCELLED` booking + new 3h booking, (d) two parallel 4h requests targeting distinct rooms `S01` and `S02` via `Promise.all` | Submit `POST /api/bookings/online` for cases (a)–(d) | (a) Both HTTP `201`; (b) HTTP `409 DAILY_QUOTA_EXCEEDED`; (c) HTTP `201` (`CANCELLED` excluded); (d) Strictly one HTTP `201` and one HTTP `409 DAILY_QUOTA_EXCEEDED` (serialized via `users` $\rightarrow$ `rooms` `FOR UPDATE` lock). | **PLANNED (TDD)** |
| **TEST-04j** | `AC-04j` | Domain & Persistence (TDD) | Authenticated `CUSTOMER` JWT (`customer1`) & `STAFF` JWT (`staff`); Room `M01` (`hourlyRate: 350`), `startSlot: 0`, `durationHours: 3`, `partySize: 4`, plus forged body field `totalPrice: 1` | Submit `POST /api/bookings/online`, then query `GET /api/bookings/my`, `GET /api/bookings/:id`, and Staff `GET /api/bookings/master?date=...` | Forged `totalPrice: 1` ignored; server persists `totalPrice: 1050` (`350 * 3`) in PostgreSQL and returns `totalPrice: 1050` identically across all four endpoints. | **PLANNED (TDD)** |

- **Planned Execution Command (Issue 2 — Serial M1 Safe):** `npm run test:server` (`jest --runInBand`) & `npm run test:client`
- **Planned Regression Scope (Issue 2):** Must execute and pass 100% of all existing Sprint 1 suites (`TEST-01`–`TEST-06`), Lab 6 concurrency/defect suites (`DEF-SS-01`–`DEF-SS-03`), and client layout smoke tests alongside `TEST-02b`, `TEST-03c`, and `TEST-04g`–`TEST-04j`.
