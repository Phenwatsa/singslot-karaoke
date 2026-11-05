# Requirements Traceability Matrix
## Project: SingSlot — Karaoke Room Reservation & Management System
**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents  
**Document Version:** 1.2.0 (Rigorous Engineering Baseline)  
**Date:** November 2026  

---

## 1. Traceability Matrix (Requirements $\rightarrow$ Feature $\rightarrow$ Sprint $\rightarrow$ Issue $\rightarrow$ Verification)

| Req ID | Requirement Description | Linked Feature | Sprint | Responsible Issue | Verification ID (AC / TEST) | Coverage Status |
|---|---|---|---|---|---|---|
| **FR-01** | Login, Logout & Current User via seeded accounts | F-01 | **Sprint 1** | Issue #2 | AC-01, AC-01a, AC-01b / TEST-01, TEST-01a, TEST-01b, TEST-01e | Fully Covered |
| **FR-02** | Room catalog display with capacity tiers (S/M/L) | F-02 | **Sprint 1** | Issue #3 | AC-02 / TEST-02 | Fully Covered |
| **FR-03** | Server-calculated slot availability (0..13) | F-03 | **Sprint 1** | Issue #3 | AC-03 / TEST-03 | Fully Covered |
| **FR-04** | Customer online booking (1–5 contiguous hours) | F-04 | **Sprint 1** | Issue #4 | AC-04a / TEST-04a | Fully Covered |
| **FR-05** | Customer "My Bookings" & Booking Detail view | F-05 | **Sprint 1** | Issue #6 | AC-05, AC-05b / TEST-05, TEST-05b | Fully Covered |
| **FR-06** | Staff Master Schedule inspection grid | F-06 | **Sprint 1** | Issue #6 | AC-06 / TEST-06 | Fully Covered |
| **FR-07** | Staff walk-in counter booking | F-07 | **Sprint 2** | Sprint 2 Backlog | AC-07 / TEST-07 (Planned) | Allocated to Sprint 2 |
| **FR-08** | Staff slot maintenance & blockout | F-09 | **Sprint 2** | Sprint 2 Backlog | AC-08 / TEST-08 (Planned) | Allocated to Sprint 2 |
| **FR-09** | Booking cancellation with 24h advance policy | F-08 | **Sprint 2** | Sprint 2 Backlog | AC-09 / TEST-09 (Planned) | Allocated to Sprint 2 |
| **FR-10** | Booking rescheduling with 24h advance policy | F-08 | **Sprint 2** | Sprint 2 Backlog | AC-10 / TEST-10 (Planned) | Allocated to Sprint 2 |
| **FR-11** | Staff multi-criteria booking search and filter | F-10 | **Sprint 2** | Sprint 2 Backlog | AC-11 / TEST-11 (Planned) | Allocated to Sprint 2 |
| **FR-12** | Customer online self-registration | F-11 | **Sprint 3** | Sprint 3 Backlog | AC-12 / TEST-12 (Planned) | Allocated to Sprint 3 |
| **FR-13** | Room Management CRUD for Staff | F-12 | **Sprint 3** | Sprint 3 Backlog | AC-13 / TEST-13 (Planned) | Allocated to Sprint 3 |
| **FR-14** | Room occupancy and utilization reporting | F-13 | **Sprint 3** | Sprint 3 Backlog | AC-14 / TEST-14 (Planned) | Allocated to Sprint 3 |
| **BR-01** | Contiguous slot rule (1–5 hrs, no gaps, no occupied slots) | F-04 | **Sprint 1** | Issue #4, #5 | AC-04a, AC-04b / TEST-04a, TEST-04b | Fully Covered (TDD) |
| **BR-02** | Exclusive room reservation (strictly 1 active claim per slot) | F-04 | **Sprint 1** | Issue #1, #5 | AC-04b / TEST-04b, TEST-04e | Verified via DB Constraint |
| **BR-03** | Operating window enforcement (Slots 0..13, 10:00–24:00) | F-02, F-03 | **Sprint 1** | Issue #3, #4 | AC-03, AC-04c / TEST-03, TEST-04c | Fully Covered |
| **BR-04** | Past-time slot rejection relative to Asia/Bangkok time | F-04 | **Sprint 1** | Issue #4 | AC-04c / TEST-04c | Fully Covered |
| **BR-05** | Capacity validation against room tier maximums | F-04 | **Sprint 1** | Issue #4 | AC-04d / TEST-04d | Fully Covered |
| **BR-06** | Concurrent booking isolation (no double booking) | F-04 | **Sprint 1** | Issue #5 | AC-04e / TEST-04e | Fully Covered |
| **BR-07** | Customer data privacy (cross-customer read forbidden) | F-05 | **Sprint 1** | Issue #6 | AC-05b / TEST-05b | Fully Covered |
| **BR-08** | Staff endpoints restricted to `STAFF` role | F-01, F-06 | **Sprint 1** | Issue #2, #6 | AC-01c, AC-06 / TEST-01c, TEST-06 | Fully Covered |
| **BR-09** | Cancellation/rescheduling restricted within 24h window | F-08 | **Sprint 2** | Sprint 2 Backlog | AC-09a / TEST-09a (Planned) | Allocated to Sprint 2 |
| **BR-10** | Slot maintenance blocks cannot overlap confirmed bookings | F-09 | **Sprint 2** | Sprint 2 Backlog | AC-08b / TEST-08b (Planned) | Allocated to Sprint 2 |
| **NFR-01** | Password hashed with `bcrypt` (salt rounds $\ge 10$) | F-01 | **Sprint 1** | Issue #2 | AC-01d / TEST-01d | Verified via DB Assertions |
| **NFR-02** | Unauthenticated/unauthorized access yields HTTP 401/403 $\le 50$ms | F-01, F-05 | **Sprint 1** | Issue #2, #6 | AC-01b, AC-01c / TEST-01b, TEST-01c | Verified via Supertest Suite |
| **NFR-03** | Multi-slot bookings execute inside ACID transaction | F-04 | **Sprint 1** | Issue #4 | AC-04f / TEST-04f | Verified via Fault Injection |
| **NFR-04** | Availability query latency under 200 ms with 50 bookings | F-03 | **Sprint 2** | Sprint 2 Backlog | AC-03b / TEST-03b (Planned) | Allocated to Sprint 2 |
| **NFR-05** | Reproducible container execution and restart durability | F-14 | **Lab 5** | Lab 5 Backlog | Lab 5 Checkpoint | Allocated to Lab 5 |

---

## 2. Coverage Analysis

* **Sprint 1 Allocation:** 6 Functional Requirements, 8 Business Rules, and 3 Non-Functional Requirements are 100% covered across 6 defined GitHub Issues and 14 automated tests.
* **Sprint 2 Allocation:** 5 Functional Requirements (F-07 through F-10), 2 Business Rules (BR-09, BR-10), and 1 NFR (NFR-04).
* **Sprint 3 Allocation:** 3 Functional Requirements (F-11 through F-13) and final hardening.
* **Coverage Gaps:** Zero unmapped requirements.
