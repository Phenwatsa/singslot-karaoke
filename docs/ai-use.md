# AI Use & Assistance Log
## Project: SingSlot — Karaoke Room Reservation & Management System
**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents  
**Target:** Transparency, Traceability, and AI Governance  

---

## Log Entries

| Timestamp | Developer Prompt / Task Objective | AI Tool / Model | Assistance Provided & Concrete Outcome |
|---|---|---|---|
| 2026-11-04 | Initial project planning and Topic 1 domain selection | Antigravity (Gemini 2.5 Flash) | Analyzed CPE 334 specification and mapped SingSlot (Karaoke Reservation) to Topic 1 requirements. Formulated baseline scope questions. |
| 2026-11-04 | Full academic baseline documentation generation | Antigravity (Gemini 2.5 Flash) | Generated baseline engineering documents in `docs/`: `srs.md` (FRs, BRs, NFRs), `features.md`, `traceability.md`, `system-sds.md`, `plan.md`, and `contracts.md`. |
| 2026-11-04 | Sprint 1 Lean Scope Optimization | Antigravity (Gemini 2.5 Flash) | Refined Sprint 1 scope into "The Golden Booking Slice" (deferred self-registration, walk-ins, and room CRUD to later sprints) to ensure feasible delivery for Nov 8. |
| 2026-11-05 | Engineering Protocol & Working Rules Formalization | Antigravity (Gemini 2.5 Flash) | Established `AGENTS.md` and `GEMINI.md` incorporating M1 8GB RAM Guard, strict Git safety, issue freezing, PR handover specifications, and language standards. |
| 2026-11-05 | UI Layout Pattern & PR Naming Rule Enhancement | Antigravity (Gemini 2.5 Flash) | Added Section 3 (Unified UI Template & Layout Pattern) and updated Section 2.4 (non-closing `[Issue #X]` PR title format) to `AGENTS.md` and `GEMINI.md`. |
| 2026-11-05 | Teammate Pair Allocation & Issue Assignment | Antigravity (Gemini 2.5 Flash) | Assigned vertical slices between @Phenwatsa (Pair A: Auth, Availability) and @lephirada (Pair B: Booking Engine, Conflict TDD, History Views) in `docs/github-issues-guide.md`. |
| 2026-11-05 | Peer Review Defect Correction & Baseline Formalization | Antigravity (Gemini 2.5 Flash) | Corrected all baseline documents (SRS, SDS, Traceability, Plan, Contracts, Issues Guide): established PostgreSQL as primary DB, standardized slot indexing (0..13), added RoomBlock and booking detail endpoint `GET /api/bookings/:id`, defined logout and cancellation mechanics, and revised all 6 Issue descriptions. |
| 2026-11-05 | Resolution of PR #1 Blockers & Migration Scaffolding | Antigravity (Gemini 2.5 Flash) | Added committed Prisma PostgreSQL migration (`20261105000000_init`), configured npm workspaces, added client test script, implemented idempotent seed logic, documented pessimistic room-locking concurrency strategy (`SELECT FOR UPDATE`), and updated README setup guide. |
