# SingSlot — Karaoke Room Reservation & Management System

> **Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents  
> **Topic 1:** Appointment and Scheduling System  
> **Team:** 2 Students (@Phenwatsa & @lephirada)  
> **Status:** Deliverable 2 Staging Candidate (`feat/sprint3-and-d2-release` — Sprint 1 + Lab 5–7 + Sprint 2 + Sprint 3 `F-11`; target release tag: `v0.3.0-rc1` pending Release PR)  

---

## 🎤 About SingSlot

SingSlot is a full-stack web reservation platform tailored for a single-venue private karaoke establishment. It features categorized room capacity tiers (Small, Medium, Large) operating daily between **10:00 and 24:00 ICT (UTC+7)** partitioned into **14 discrete 1-hour slots (indexed 0 to 13)**. The system provides seamless online bookings for customers and operational schedule management for staff over a unified PostgreSQL database with zero-conflict concurrency guarantees.

---

## 📚 Project Documentation

All formal software engineering specifications and sprint artifacts are maintained under the [`docs/`](./docs/) directory (`v1.4.0`):

- [**Software Requirements Specification (SRS)**](./docs/system-specifications/srs.md): Product scope, actors, `FR-01`–`FR-14`, `BR-01`–`BR-12` (including Lab 7 rules), and `NFR-01`–`NFR-05`.
- [**Feature Catalog**](./docs/system-specifications/features.md): Baseline features `F-01` through `F-14` mapped across Sprint 1–3 (`F-01`–`F-11` implemented; `F-12`–`F-14` planned for 13 Dec).
- [**Requirements Traceability Matrix**](./docs/system-specifications/traceability.md): End-to-end traceability (`v1.4.0`) mapping requirements to actual test files and results across 13 server test suites (`122` tests) and 12 client smoke tests, with explicit planned gaps.
- [**System-Level Design Specification (SDS)**](./docs/system-specifications/system-sds.md): Decoupled architecture, ERD, database constraints, `users` → `rooms` pessimistic locking strategy, and API/RBAC conventions (`v1.4.0`).
- [**Three-Sprint Development Plan**](./docs/sprints/plan.md): 3-sprint roadmap and milestone plan.
- [**Sprint Engineering Contracts**](./docs/sprints/sprint-1/contracts.md): [Sprint 1](./docs/sprints/sprint-1/contracts.md), [Sprint 2](./docs/sprints/sprint-2/contracts.md), [Sprint 3](./docs/sprints/sprint-3/contracts.md), and [Sprint 3 Remaining Work](./docs/sprints/sprint-3/remaining-work.md).
- [**Team & Agent Working Rules**](./AGENTS.md): Hardware memory guards (M1 8GB RAM), Git protocols, TDD rules, and UI layout conventions.
- [**AI Usage & Governance Logs**](./docs/ai-use.md): Representative prompt disclosures across Sprints 1–3 and Labs 5–7.

---

## 🛠 Tech Stack (M1 8GB RAM Optimized)

- **Frontend:** React (Vite) + TypeScript + Tailwind CSS + Lucide Icons (<100MB RAM)
- **Backend:** Node.js + Express.js (TypeScript) + RESTful JSON API (<80MB RAM)
- **Persistence:** PostgreSQL via Prisma ORM (Composite Unique Constraints & Pessimistic Row Locking)
- **Testing:** Supertest + Jest (Server API baseline & static contract checks) & Node Native Test Runner (Client layout structural smoke tests) with `--runInBand`

---

## 🚀 Reproducible Setup & Fresh Clone Guide

Follow these verified steps to clone, configure, migrate, and execute the application locally from scratch:

### 1. Prerequisites
- **Node.js:** v20.x or later (`node -v`)
- **npm:** v10.x or later (`npm -v`)
- **PostgreSQL:** Running locally on port `5432`

### 2. Clone Repository & Install Dependencies
```bash
git clone https://github.com/Phenwatsa/singslot-karaoke.git
cd singslot-karaoke

# Install dependencies across all npm workspaces (client & server)
npm install
```

### 3. Database Initialization
Ensure PostgreSQL is active, then create the application database:
```bash
# macOS (Homebrew PostgreSQL)
createdb singslot_dev

# Alternatively, using psql:
# psql -U postgres -c "CREATE DATABASE singslot_dev;"
```

### 4. Configure Environment Variables
```bash
# For local Node.js development (server/)
cp server/.env.example server/.env
# 1. Verify DATABASE_URL in server/.env matches your PostgreSQL username and password
# 2. Configure JWT_SECRET in server/.env with a unique random secret (e.g., generate via `openssl rand -base64 32`).
#    Note: The server enforces fail-fast validation and will abort startup if JWT_SECRET is missing or blank.

# For Docker Compose (repository root)
cp .env.example .env
# Populate POSTGRES_USER, POSTGRES_PASSWORD, JWT_SECRET, STAFF_PASSWORD, and CUSTOMER_PASSWORD in root .env before running `docker compose up`.
```

### 5. Run Database Migrations & Idempotent Seed
```bash
# Execute committed initial migration from clean database
npm run prisma:migrate

# Idempotently seed 3 demo accounts and 9 karaoke rooms
npm run prisma:seed
```

### 6. Running the Application
```bash
# Terminal 1: Run Express Backend API (http://localhost:5001)
npm run dev:server

# Terminal 2: Run React Vite Client (http://localhost:3000)
npm run dev:client
```

### 7. Running Quality Checks & Tests
```bash
# Typecheck across both client and server
npm run typecheck

# Run test suites serially (Single-worker, M1 8GB RAM safe)
npm test
```
*(Note: Issue #1 verifies server API health envelopes, schema DDL contracts, and client layout structural smoke tests in an unauthenticated baseline shell. Full database execution evidence is documented in PR #1, and interactive authentication/booking tests begin in Issue #2 and #3).*
