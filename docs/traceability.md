# Requirements Traceability Matrix
## Project: SingSlot — Karaoke Room Reservation & Management System
**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents  
**Document Version:** 1.1.0 (Refined Lean-Sprint Allocation)  
**Date:** November 2026  

---

## 1. Traceability Matrix (Requirements $\rightarrow$ Feature $\rightarrow$ Sprint $\rightarrow$ Verification)

| Requirement ID | Requirement Description | Linked Feature ID | Planned Sprint | Verification ID (AC / TEST) | Baseline Coverage Status |
|---|---|---|---|---|---|
| **FR-01** | Login / Logout with seeded accounts & JWT | F-01 | **Sprint 1** | AC-01 / TEST-01 | Fully Covered in Sprint 1 |
| **FR-02** | Room catalog display with capacity tiers (S/M/L) | F-02 | **Sprint 1** | AC-02 / TEST-02 | Fully Covered in Sprint 1 |
| **FR-03** | Real-time 14-slot availability lookup (10:00–24:00) | F-03 | **Sprint 1** | AC-03 / TEST-03 | Fully Covered in Sprint 1 |
| **FR-04** | Customer online booking (1–5 contiguous hours) | F-04 | **Sprint 1** | AC-04 / TEST-04 | Fully Covered in Sprint 1 |
| **FR-05** | "My Bookings" portal for authenticated customers | F-05 | **Sprint 1** | AC-05 / TEST-05 | Fully Covered in Sprint 1 |
| **FR-06** | Staff Master Schedule inspection grid | F-06 | **Sprint 1** | AC-06 / TEST-06 | Fully Covered in Sprint 1 |
| **FR-07** | Staff walk-in counter booking | F-07 | **Sprint 2** | AC-07 / TEST-07 (Planned) | Allocated to Sprint 2 |
| **FR-08** | Booking cancellation with 24h advance policy | F-08 | **Sprint 2** | AC-08 / TEST-08 (Planned) | Allocated to Sprint 2 |
| **FR-09** | Booking rescheduling to open slots | F-08 | **Sprint 2** | AC-09 / TEST-09 (Planned) | Allocated to Sprint 2 |
| **FR-10** | Staff multi-criteria booking search and filter | F-10 | **Sprint 2** | AC-10 / TEST-10 (Planned) | Allocated to Sprint 2 |
| **FR-11** | Customer self-registration online | F-11 | **Sprint 3** | AC-11 / TEST-11 (Planned) | Allocated to Sprint 3 |
| **FR-12** | Room Management CRUD for Staff | F-12 | **Sprint 3** | AC-12 / TEST-12 (Planned) | Allocated to Sprint 3 |
| **FR-13** | Room occupancy and utilization reporting | F-13 | **Sprint 3** | AC-13 / TEST-13 (Planned) | Allocated to Sprint 3 |
| **BR-01** | Contiguous slot rule (1–5 hrs, no gaps, no occupied slots) | F-04 | **Sprint 1** | AC-04a / TEST-04a | Verified via Core Logic |
| **BR-02** | Exclusive room reservation (strictly 1 booking per slot) | F-04 | **Sprint 1** | AC-04b / TEST-04b | Verified via DB Unique Constraints |
| **BR-03** | Operating window enforcement (10:00 to 24:00 only) | F-02, F-03 | **Sprint 1** | AC-02b / TEST-02b | Verified via Catalog Boundaries |
| **BR-04** | Past-time slot rejection relative to server time | F-04 | **Sprint 1** | AC-04c / TEST-04c | Verified via Validation Unit Tests |
| **BR-05** | Capacity validation against room category maximums | F-04 | **Sprint 1** | AC-04d / TEST-04d | Verified via Validation Unit Tests |
| **BR-06** | Concurrent booking isolation (no double booking) | F-04 | **Sprint 1** | AC-04e / TEST-04e | Verified via Concurrency Suite |
| **BR-07** | Customer data privacy (cross-customer read forbidden) | F-05 | **Sprint 1** | AC-05b / TEST-05b | Verified via Security Access Tests |
| **BR-08** | Staff dashboard restricted to `STAFF` role | F-01, F-06 | **Sprint 1** | AC-01b / TEST-01b | Verified via RBAC Middleware Tests |
| **BR-09** | Cancellation/rescheduling restricted within 24h window | F-08 | **Sprint 2** | AC-08a / TEST-08a (Planned) | Allocated to Sprint 2 |
| **NFR-01** | Password hashed with `bcrypt` (salt rounds $\ge 10$) | F-01 | **Sprint 1** | AC-01c / TEST-01c | Verified via Storage Assertions |
| **NFR-02** | Unauthenticated/unauthorized access yields HTTP 401/403 | F-01, F-05 | **Sprint 1** | AC-01d / TEST-01d | Verified via Security Integration Suite |
| **NFR-03** | Multi-slot bookings execute inside ACID transaction | F-04 | **Sprint 1** | AC-04f / TEST-04f | Verified via Rollback Fault Injections |
| **NFR-04** | Availability query latency under 200 ms | F-03 | **Sprint 2** | AC-03b / TEST-03b (Planned) | Allocated to Sprint 2 |
| **NFR-05** | Reproducible container execution and restart durability | F-14 | **Sprint 2 / Lab 5**| Lab 5 Checkpoint | Allocated to Lab 5 |

---

## 2. Coverage Analysis

* **Functional Requirements (13 total):** 6 in Sprint 1 (46.2%), 4 in Sprint 2 (30.8%), 3 in Sprint 3 (23.0%).
* **Business Rules (9 total):** 8 verified in Sprint 1 (88.9%), 1 in Sprint 2 (11.1%).
* **Non-Functional Requirements (5 total):** 3 verified in Sprint 1 (60.0%), 2 verified in Sprint 2 / Lab 5 (40.0%).
* **Baseline Coverage:** 100% of functional requirements, domain rules, and quality attributes trace to concrete implementation and tests.
