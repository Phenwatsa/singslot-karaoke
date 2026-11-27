# Sprint 3 Remaining Work & Final Completion Plan (To 13 December 2026)

## Project: SingSlot — Karaoke Room Reservation & Management System
**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents (1/2026)  
**Checkpoint Baseline:** `v0.3.0-rc1` (Deliverable 2 Integrated Release Candidate — 29 Nov 2026)  
**Final Submission Deadline:** 13 December 2026 at 23:59  
**Exam Period Constraint:** Final Examinations **1–11 December 2026**

---

## 1. Explicit Remaining-Work Register

| Feature or Defect ID | Current Status (at `v0.3.0-rc1`) | Remaining Action | Owner & Target Date |
|---|---|---|---|
| **F-11** (`FR-12`, `AC-12`) | **Implemented & Tested** (`TEST-12` passing in `server/tests/sprint3-register.test.ts` on `feat/sprint3-and-d2-release` / `v0.3.0-rc1`). | Complete post-deployment smoke verification on Cloud Run. | `@lephirada` — 29 Nov 2026 |
| **F-12** (`FR-13`, `AC-13`) | **Contract Defined** (`docs/sprints/sprint-3/contracts.md` §2.2); **Not Implemented**. | Implement `POST /api/rooms`, `PATCH /api/rooms/:id`, `DELETE /api/rooms/:id` (soft-deactivate `isActive = false`), Staff Room Management UI, and `TEST-13` (`--runInBand`). | `@Phenwatsa` — 12 Dec 2026 (post-exams) |
| **F-13** (`FR-14`, `AC-14`) | **Contract Defined** (`docs/sprints/sprint-3/contracts.md` §2.3); **Not Implemented**. | Implement `GET /api/reports/summary` (total + `byRoom` + `byChannel` + `peakSlots`), Staff Analytics dashboard UI, and `TEST-14` numeric fixture assertions. | `@lephirada` — 12 Dec 2026 (post-exams) |
| **DEF-SS-04 (4B)** | **Open Technical Debt (P3)** (wildcard `cors()` in `server/src/app.ts`). | Restrict CORS origin via `CORS_ORIGIN` environment variable and verify allowed/rejected origins in `TEST-14-POLISH`. | `@Phenwatsa` — 12 Dec 2026 |
| **F-14** (`AC-14-POLISH`) | **Planned** (UI polish, final regression, UAT re-test, demo video). | Run full regression (`--runInBand`), perform final Cloud Run deploy & UAT re-test, and record final demonstration video. | `@Phenwatsa` & `@lephirada` — 13 Dec 2026 |

---

## 2. Dated Execution Schedule Around Final Exams (1–11 Dec 2026)

| Date Window | Planned Milestone | Owners |
|---|---|---|
| **29 Nov 2026** | Submit Deliverable 2 (`v0.3.0-rc1` deployed on GCP Cloud Run with Sprint 1 + Lab 7 + Sprint 2 + `F-11`). | `@Phenwatsa` & `@lephirada` |
| **1–11 Dec 2026** | Final Examination Period (lightweight bug triage only if any defect is reported; no major workflow changes). | Both |
| **12 Dec 2026** | Implement & peer-review `F-12` (Room CRUD), `F-13` (Occupancy Reports), and `DEF-SS-04 (4B)` CORS hardening; pass `TEST-01`–`TEST-14` + `TEST-14-POLISH` (`--runInBand`). | `@Phenwatsa` & `@lephirada` |
| **13 Dec 2026** | Final `main` release, Cloud Run production deployment & post-deploy checks, record final demo video, and submit Final Delivery package. | `@Phenwatsa` & `@lephirada` |
