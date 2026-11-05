# Sprint 1 AI Usage Log & Reflection
## Project: SingSlot — Karaoke Room Reservation & Management System
**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents  
**Target:** Deliverable 1 (Sprint 1 Lean Delivery — The Golden Online Booking Slice)  
**Primary AI Model:** Antigravity AI / Gemini 3.8 Flash  

---

## 1. Key Representative AI Prompts & Engineering Outcomes

| # | Prompt Intent & Task Objective | AI Tool / Model | Concrete Engineering Outcome |
|:---:|---|---|---|
| **1** | **Sprint 1 Lean Scope Optimization:** Define minimal end-to-end "Golden Online Booking Slice" for Nov 8 deadline. | Antigravity AI / Gemini 3.8 Flash | Formulated bounded scope: online booking, 9 rooms, 14 slots (0..13), JWT login with seeded users; deferred walk-in and self-registration to Sprint 2/3. |
| **2** | **Relational Schema & Concurrency Strategy:** Design Prisma PostgreSQL schema preventing double bookings and race conditions. | Antigravity AI / Gemini 3.8 Flash | Generated models (`User`, `Room`, `Booking`, `BookingSlot`, `RoomBlock`) with composite unique constraints `@@unique([roomId, bookingDate, slotIndex])` and documented transactional row locking (`SELECT FOR UPDATE`). |
| **3** | **Monorepo Scaffolding & M1 RAM Safety:** Configure decoupled React (Vite) and Node.js (Express) with memory guard. | Antigravity AI / Gemini 3.8 Flash | Configured root npm workspaces, authoritative `package-lock.json`, and strictly single-worker `--runInBand` test scripts (<100MB footprint for MacBook M1 8GB RAM). |
| **4** | **Unified UI Layout Shell:** Establish centralized layout template components preventing fragmented styles. | Antigravity AI / Gemini 3.8 Flash | Built `AppLayout.tsx`, `PageHeader.tsx`, and `GlassCard.tsx` under `client/src/components/layout/` with neon dark-mode theme, unauthenticated default state, and wired navigation callbacks. |
| **5** | **Automated Baseline Verification:** Create fast, reliable test suite for API health and design system contracts. | Antigravity AI / Gemini 3.8 Flash | Created Express health/404 tests in Jest and a zero-dependency Node-native component smoke test (`layout.test.mjs`), achieving 11/11 passing tests in <1 second. |
| **6** | **Database Migration & Idempotent Seed:** Ensure clean clone setup from an empty database without password overwrite. | Antigravity AI / Gemini 3.8 Flash | Generated committed migration `20261105000000_init` and idempotent `seed.ts` logic that preserves existing bcrypt hashes across repeated runs. |
| **7** | **Issue #2 Scope & RBAC Architecture Breakdown:** Deconstruct authentication specifications, JWT claims, bcrypt verification, and automated test suite. | Antigravity AI / Gemini 3.8 Flash | Defined implementation plan for `POST /api/auth/login`, `logout`, `me`, RBAC middlewares (`verifyToken`, `requireRole`), and Supertest suite for `TEST-01` through `TEST-01e`. |

---

## 2. Engineering Reflection on AI Assistance

Working with **Antigravity AI / Gemini 3.8 Flash** significantly accelerated the architectural specification and baseline scaffolding phases of Sprint 1. By adopting a **Spec-First** discipline, the AI acted as a rigorous pair-programming partner:
- **Specification Rigor:** Grounding the prompt workflow in `docs/srs.md` and `docs/system-sds.md` prevented arbitrary feature drift and ensured every database constraint directly mapped to a business rule.
- **Hardware Constraint Adherence:** Constraining the assistant with strict M1 8GB RAM guidelines eliminated heavy headless browser dependencies and parallel worker crashes, keeping test execution under 1.5 seconds.
- **Developer Responsibility:** While the agent drafted boilerplate schema, migration SQL, and test cases, the human developer remained strictly responsible for verifying runtime database behavior, reviewing commit history, and ensuring authentic peer review integrity.
