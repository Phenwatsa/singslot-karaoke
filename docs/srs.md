# Software Requirements Specification (SRS)
## Project: SingSlot — Karaoke Room Reservation & Management System
**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents  
**Theme:** Topic 1 — Appointment and Scheduling System  
**Document Version:** 1.1.0 (Refined Lean-Sprint Allocation)  
**Date:** November 2026  

---

## 1. Stakeholder Problem & Context

### 1.1 Context
**SingSlot** is an appointment and room reservation system designed for a single-branch karaoke establishment. The facility features private karaoke rooms across three capacity tiers (Small, Medium, Large). Operating across two operational channels:
1. **Online Booking (Primary Golden Flow):** Customers browse room availability, select time slots, and submit reservations online.
2. **Staff Schedule Inspection & Operations:** Staff monitor the master schedule across all rooms, ensure smooth room turnover, and later handle on-premise walk-ins and maintenance.

Both channels utilize a unified, persistent database to eliminate double bookings and enforce strict real-time conflict prevention.

### 1.2 Stakeholder Problem
* **Booking Collisions & Double Bookings:** Manual recording or decentralized scheduling leads to conflicting reservations for the same room.
* **Multi-Hour Contiguous Slot Verification:** Karaoke reservations span 1 to 5 consecutive hours. Checking contiguous availability manually is error-prone.
* **Lack of Data Privacy & Centralized Visibility:** Customers lack a secure view of their own reservations, while staff need an authoritative master schedule.

---

## 2. Actors & User Roles

| Role ID | Role Name | Description & Core Responsibilities |
|---|---|---|
| **ACT-01** | **Customer** | Authenticated customer using the web portal. Browses room availability, books 1–5 contiguous hours online, and views private booking history under "My Bookings". Restricted from staff views and other users' bookings. |
| **ACT-02** | **Staff** | On-premise staff member. Logs in to inspect the global master schedule across all rooms and oversee venue reservations. (Walk-in booking and slot maintenance are expanded in Sprint 2). |

---

## 3. Product Scope & Explicit Exclusions

### 3.1 In-Scope
* **Operating Hours:** Daily operations between **10:00 and 24:00 (Midnight)**, partitioned into 14 discrete 1-hour slots.
* **Pre-Seeded Room Fleet (9 Rooms):**
  * **Small (S01, S02, S03):** Maximum capacity 4 guests.
  * **Medium (M01, M02, M03):** Maximum capacity 8 guests.
  * **Large (L01, L02, L03):** Maximum capacity 12 guests.
* **Contiguous Booking Model:** 1 to 5 consecutive hours in the same room with exclusive room reservation.
* **Sprint 1 Golden Slice:** Seeded authentication, room availability query, online customer booking, "My Bookings", and staff schedule inspection.
* **Automated Conflict & Concurrency Prevention:** Composite unique constraints in PostgreSQL ensuring zero overlapping bookings.

### 3.2 Explicit Exclusions (Out of Scope for Sprint 1 / Project Baseline)
1. **No Real Payment Gateway:** Booking confirmation uses simulated authorization states.
2. **No Food & Beverage Ordering:** In-room catering is excluded.
3. **No Loyalty Points / Promotions:** Points and discount codes are excluded.
4. **No Multi-Branch Architecture:** Single venue only.
5. **No SMS / External Notification Gateway:** All notices remain within the web interface.
6. **No Self-Registration in Sprint 1:** Per course specifications, seeded accounts are utilized for Sprint 1; public self-registration is deferred to Sprint 3.
7. **No Room Management CRUD in Sprint 1:** Room inventory is seeded statically for Sprint 1; dynamic CRUD is deferred to Sprint 3.

---

## 4. Functional Requirements (FR)

| FR ID | Functional Requirement Description | Target Actor | Delivery Sprint |
|---|---|---|---|
| **FR-01** | The system shall provide secure login/logout for Customer and Staff using seeded credentials and JWT session tokens. | ACT-01, ACT-02 | **Sprint 1** |
| **FR-02** | The system shall display the room catalog (Small, Medium, Large) with respective capacity limits. | ACT-01, ACT-02 | **Sprint 1** |
| **FR-03** | The system shall display real-time slot availability (14 hourly slots: 10:00–24:00) for all rooms for any selected date. | ACT-01, ACT-02 | **Sprint 1** |
| **FR-04** | The system shall allow Customers to submit an online booking for 1–5 contiguous hours in an available room. | ACT-01 | **Sprint 1** |
| **FR-05** | The system shall provide a "My Bookings" portal for Customers to view their own reservation records. | ACT-01 | **Sprint 1** |
| **FR-06** | The system shall provide a Master Schedule view for Staff to inspect all bookings across all rooms. | ACT-02 | **Sprint 1** |
| **FR-07** | The system shall allow Staff to submit on-premise walk-in bookings via the cashier dashboard. | ACT-02 | **Sprint 2** |
| **FR-08** | The system shall support booking cancellation subject to a 24-hour advance notice window. | ACT-01, ACT-02 | **Sprint 2** |
| **FR-09** | The system shall support booking rescheduling to alternative open slots subject to a 24-hour advance window. | ACT-01, ACT-02 | **Sprint 2** |
| **FR-10** | The system shall provide multi-criteria search and filtering for bookings (by phone, date, room). | ACT-02 | **Sprint 2** |
| **FR-11** | The system shall allow Customers to self-register an account online. | ACT-01 | **Sprint 3** |
| **FR-12** | The system shall provide Room Management CRUD (create/update rooms and rates) for Staff. | ACT-02 | **Sprint 3** |
| **FR-13** | The system shall generate operational summaries (occupancy rates and peak hours). | ACT-02 | **Sprint 3** |

---

## 5. Business Rules (BR)

| BR ID | Business Rule Title | Observable & Testable Operational Logic | Verified In |
|---|---|---|---|
| **BR-01** | **Contiguous Slot Rule** | A booking of $N$ hours ($1 \le N \le 5$) requires $N$ consecutive open slots in the same room. Booking across an occupied slot is rejected. | **Sprint 1** |
| **BR-02** | **Exclusive Room Lock** | Exactly one confirmed reservation can occupy a given room-slot tuple on any calendar date. Overlaps are rejected. | **Sprint 1** |
| **BR-03** | **Operating Hours Boundary** | Bookings are accepted strictly between 10:00 and 24:00 (Slot 1 to 14). | **Sprint 1** |
| **BR-04** | **Past Slot Rejection** | Booking requests for elapsed dates or past time slots relative to server time are rejected with HTTP 400. | **Sprint 1** |
| **BR-05** | **Capacity Limit** | Party size must not exceed the room tier capacity (Small $\le 4$, Medium $\le 8$, Large $\le 12$). | **Sprint 1** |
| **BR-06** | **Concurrent Booking Prevention** | Simultaneous requests for the same room-slot result in one success (201) and competing failures (409 Conflict). | **Sprint 1** |
| **BR-07** | **Customer Data Isolation** | Customers can only view their own reservations. Accessing another user's booking ID returns HTTP 403 Forbidden. | **Sprint 1** |
| **BR-08** | **Staff Access Boundary** | Staff schedule views and staff endpoints require authenticated `STAFF` role credentials. | **Sprint 1** |
| **BR-09** | **Advance Cancellation Notice** | Cancellation/rescheduling requires at least 24 hours advance notice prior to start slot. | **Sprint 2** |

---

## 6. Non-Functional Requirements (NFR)

| NFR ID | Attribute | Measurable Target | Verification Method | Verification Sprint |
|---|---|---|---|---|
| **NFR-01** | **Password Security** | Passwords must be hashed using `bcrypt` (salt rounds $\ge 10$). No plaintext stored. | Database assertion & code inspection | Sprint 1 |
| **NFR-02** | **Authorization Gate** | Unauthenticated/unauthorized access rejected with HTTP 401/403 within $\le 50$ ms. | Automated Supertest integration suite | Sprint 1 |
| **NFR-03** | **Transactional Integrity** | Multi-slot bookings execute inside an ACID transaction. Failures roll back completely. | Automated rollback test under simulated error | Sprint 1 |
| **NFR-04** | **Query Latency** | Availability query responds in $\le 200$ ms under standard local load. | Automated benchmark check | Sprint 2 |
| **NFR-05** | **Container Readiness** | System builds and runs cleanly in Docker. Data survives restarts. | Docker build & lifecycle script | Lab 5 / Sprint 2 |
