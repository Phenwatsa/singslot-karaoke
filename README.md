# SingSlot — Karaoke Room Reservation & Management System

> **Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents  
> **Topic 1:** Appointment and Scheduling System  
> **Team:** 2 Students (@Phenwatsa & @lephirada)  
> **Status:** Sprint 1 — The Golden Booking Slice (Deliverable 1)  

---

## 🎤 About SingSlot

SingSlot is a full-stack web reservation platform tailored for a single-venue private karaoke establishment. It features categorized room capacity tiers (Small, Medium, Large) operating daily between **10:00 and 24:00 ICT (UTC+7)** partitioned into **14 discrete 1-hour slots (indexed 0 to 13)**. The system provides seamless online bookings for customers and operational schedule management for staff over a unified PostgreSQL database with zero-conflict concurrency guarantees.

---

## 📚 Project Documentation

All formal software engineering specifications required for CPE 334 Deliverable 1 are maintained under the [`docs/`](./docs/) directory:

- [**Software Requirements Specification (SRS)**](./docs/srs.md): Product scope, actors, FR-01–FR-14, BR-01–BR-10, and NFR-01–NFR-05.
- [**Feature Catalog**](./docs/features.md): Baseline features F-01 through F-14 mapped across 3 sprints.
- [**Requirements Traceability Matrix**](./docs/traceability.md): 100% bidirectional traceability mapping requirements to 17 automated test IDs.
- [**System-Level Design Specification (SDS)**](./docs/system-sds.md): Decoupled architecture, ERD, database constraints, pessimistic room-locking concurrency strategy, and API conventions.
- [**Three-Sprint Development Plan**](./docs/sprints/plan.md): 3-sprint roadmap, video milestones, and Sprint 1 feasibility justification.
- [**Sprint 1 Engineering Contracts**](./docs/sprints/sprint-1/contracts.md): API specifications, Acceptance Criteria (`AC-01`–`AC-06`), and Software Test Specifications (`TEST-01`–`TEST-06`).
- [**Team & Agent Working Rules**](./AGENTS.md): Hardware memory guards (M1 8GB RAM), Git protocols, TDD rules, and UI layout conventions.
- [**Sprint 1 AI Usage Log & Reflection**](./docs/sprints/sprint-1/ai-use.md): Representative prompt disclosure (Gemini 3.8 Flash) and engineering reflection.

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
cp server/.env.example server/.env
# Verify DATABASE_URL in server/.env matches your PostgreSQL username and password
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
