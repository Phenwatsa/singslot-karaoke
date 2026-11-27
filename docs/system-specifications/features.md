# Feature Inventory
## Project: SingSlot — Karaoke Room Reservation & Management System
**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents  
**Document Version:** 1.4.0 (Deliverable 2 Staging Candidate — `feat/sprint3-and-d2-release`; target release `v0.3.0-rc1`)  
**Date:** 27 November 2026  

---

## 1. Baseline Feature Catalog

The SingSlot feature inventory across all three sprints is detailed below:

| Feature ID | Feature Name | Description | Linked Requirements | Dependencies | Planned Sprint |
|---|---|---|---|---|---|
| **F-01** | **Seeded User Authentication & Session Lifecycle** | Login (`POST /api/auth/login`), Logout (`POST /api/auth/logout`), and Current User retrieval (`GET /api/auth/me`) using JWT tokens and seeded accounts. | FR-01, NFR-01, NFR-02, BR-08 | None | **Sprint 1** |
| **F-02** | **Room Catalog Display** | Presentation of seeded room fleet (9 rooms: S01–S03, M01–M03, L01–L03) with capacity tier boundaries and flat hourly rates (`hourlyRate`: 200 / 350 / 500 THB/hr). | FR-02, BR-03, BR-12 | None | **Sprint 1 (Rev. Lab 7)** |
| **F-03** | **Server-Calculated Slot Availability Query** | Server-side calculation returning 14 discrete hourly slots (0..13) per room with `hourlyRate`, online bookability (`isAvailable` reflecting 60-min cutoff), `isWithinCutoff`, and `isPast` status based on confirmed bookings and room blocks. | FR-03, BR-03, BR-04, BR-12 | F-02 | **Sprint 1 (Rev. Lab 7)** |
| **F-04** | **Customer Online Booking & Conflict Prevention** | Transactional online reservation for 1–5 contiguous hours (capped at 3 hrs overlapping Peak Hours 18:00–22:00) enforcing operating boundaries, capacity, 60-min advance cutoff, 6-hr daily customer quota, concurrency locks, and server-calculated `totalPrice`. | FR-04, BR-01, BR-02, BR-03, BR-04, BR-05, BR-06, BR-11, BR-12, NFR-03 | F-01, F-03 | **Sprint 1 (Rev. Lab 7)** |
| **F-05** | **Customer My Bookings & Booking Detail Inspection** | Private reservation list (`GET /api/bookings/my`) and detailed booking view (`GET /api/bookings/:id`) enforcing strict customer data isolation and displaying persisted `totalPrice`. | FR-05, BR-07, BR-12, NFR-02 | F-01, F-04 | **Sprint 1 (Rev. Lab 7)** |
| **F-06** | **Staff Master Schedule Inspection** | Centralized cashier calendar grid displaying all confirmed reservations and persisted `totalPrice` across all 9 rooms (`GET /api/bookings/master`). | FR-06, BR-08, BR-12 | F-01, F-04 | **Sprint 1 (Rev. Lab 7)** |
| **F-07** | **Staff Walk-in Booking Counter** | On-premise cashier reservation form allowing staff to create walk-in bookings (`!isPast` only, exempt from online-only Lab 7 rules, computing `totalPrice`). | FR-07, BR-01, BR-02, BR-05, BR-06, BR-08, BR-12, NFR-03 | F-01, F-03, F-04 | **Sprint 2 (Implemented `v0.2.0-sprint2`)** |
| **F-08** | **Booking Cancellation & Rescheduling** | Cancellation (`status = CANCELLED`, slot release restoring `BR-11` quota) and rescheduling enforcing the 24-hour advance policy (`BR-09`), `totalPrice` recalculation, and `excludeBookingId` quota exclusion. | FR-09, FR-10, BR-09, BR-11, BR-12 | F-04, F-05 | **Sprint 2 (Implemented `v0.2.0-sprint2`)** |
| **F-09** | **Staff Slot Maintenance & Blockout** | Interface for staff to temporarily block specific room slots (`RoomBlock`), preventing blocks on confirmed slots (`409 BLOCK_CONFLICT`). | FR-08, BR-08, BR-10 | F-03, F-06 | **Sprint 2 (Implemented `v0.2.0-sprint2`)** |
| **F-10** | **Booking Search & Multi-criteria Filtering** | Query utilities for staff to search bookings by customer phone, date/range, room tier, or status. | FR-11, BR-08 | F-06 | **Sprint 2 (Implemented `v0.2.0-sprint2`)** |
| **F-11** | **Customer Self-Registration** | Public registration portal (`POST /api/auth/register`) enabling new customers to register accounts with `bcrypt` hashing (`>= 10` rounds) and enforced `CUSTOMER` role. | FR-12, NFR-01, NFR-02 | F-01 | **Sprint 3 (Implemented on Staging; Target `v0.3.0-rc1`)** |
| **F-12** | **Room Management CRUD** | Staff administrative interface to add, modify, or soft-deactivate rooms and configure pricing. | FR-13, BR-08, BR-12 | F-02, F-06 | **Sprint 3 (Planned 13 Dec)** |
| **F-13** | **Appointment Summary & Occupancy Reports** | Management analytics visualizing per-room and aggregate occupancy rates, revenue metrics, and peak hours. | FR-14, BR-08, BR-12 | F-06, F-10 | **Sprint 3 (Planned 13 Dec)** |
| **F-14** | **UAT Defect Fixes, Polish & Final Video** | Origin-restricted CORS (`DEF-SS-04 (4B)`), UI polish, full regression, and final demonstration video. | All FRs | All | **Sprint 3 (Planned 13 Dec)** |
