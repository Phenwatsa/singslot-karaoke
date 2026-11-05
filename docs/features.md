# Feature Inventory
## Project: SingSlot — Karaoke Room Reservation & Management System
**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents  
**Document Version:** 1.1.0 (Refined Lean-Sprint Allocation)  
**Date:** November 2026  

---

## 1. Baseline Feature Catalog

The SingSlot feature inventory is distributed across the three sprints to ensure delivery of a complete, working vertical slice in Sprint 1 without overburdening development:

| Feature ID | Feature Name | Description | Linked Requirements | Dependencies | Planned Sprint |
|---|---|---|---|---|---|
| **F-01** | **Seeded User Authentication & Session** | Login/logout for Customer and Staff using seeded demo accounts, JWT token management, session retrieval (`/api/auth/me`). | FR-01, NFR-01, NFR-02, BR-08 | None | **Sprint 1** |
| **F-02** | **Room & Slot Catalog Display** | Presentation of seeded room fleet (S01–S03, M01–M03, L01–L03) and 14 hourly slots (10:00–24:00). | FR-02, BR-03 | None | **Sprint 1** |
| **F-03** | **Real-time Slot Availability Query** | Live schedule query returning availability for all rooms on any selected calendar date. | FR-03, BR-03, BR-04 | F-02 | **Sprint 1** |
| **F-04** | **Customer Online Booking & Conflict Prevention** | End-to-end booking for 1–5 contiguous hours, contiguous slot validation, past-slot rejection, and atomic transaction persistence. | FR-04, BR-01, BR-02, BR-04, BR-05, BR-06, NFR-03 | F-01, F-03 | **Sprint 1** |
| **F-05** | **Customer My Bookings & Data Privacy** | Private booking list for customers with strict data isolation from other users. | FR-05, BR-07, NFR-02 | F-01, F-04 | **Sprint 1** |
| **F-06** | **Staff Master Schedule Inspection** | Staff dashboard displaying the global reservation calendar across all 9 rooms. | FR-06, BR-08 | F-01, F-04 | **Sprint 1** |
| **F-07** | **Staff Walk-in Booking Counter** | On-premise cashier booking form allowing staff to enter customer details and book directly. | FR-07, BR-01, BR-02, BR-06, BR-08 | F-01, F-03, F-04 | **Sprint 2** |
| **F-08** | **Booking Cancellation & Rescheduling** | Self-service cancellation and rescheduling under the $\ge 24$-hour advance notice policy. | FR-08, FR-09, BR-09 | F-04, F-05 | **Sprint 2** |
| **F-09** | **Staff Slot Maintenance & Blockout** | Interface for staff to temporarily block specific room slots for maintenance/cleaning. | FR-03, BR-08 | F-03, F-06 | **Sprint 2** |
| **F-10** | **Booking Search & Multi-criteria Filtering** | Staff query tools to search reservations by customer phone, date range, or room tier. | FR-10 | F-06 | **Sprint 2** |
| **F-11** | **Customer Self-Registration** | Public onboarding form allowing new customers to register accounts with password hashing. | FR-11, NFR-01 | F-01 | **Sprint 3** |
| **F-12** | **Room Management CRUD** | Staff administrative interface to add, modify, or deactivate rooms and hourly pricing. | FR-12, BR-08 | F-02, F-06 | **Sprint 3** |
| **F-13** | **Appointment Summary & Occupancy Reports** | Analytics dashboard calculating room utilization percentages, revenue estimates, and peak hours. | FR-13 | F-06, F-10 | **Sprint 3** |
| **F-14** | **UAT Defect Fixes, Polish & Demo Video** | Aesthetic enhancements (gradient/neon styling), cross-team defect resolution, and 10-minute demo video. | All FRs | All | **Sprint 3** |
