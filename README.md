# SingSlot — Karaoke Room Reservation & Management System

> **Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents  
> **Topic 1:** Appointment and Scheduling System  
> **Team:** 2 Students (@Phenwatsa & Teammate)  
> **Status:** Sprint 1 — The Golden Booking Slice (Deliverable 1)  

---

## 🎤 About SingSlot

SingSlot is a full-stack web reservation platform tailored for a single-venue private karaoke establishment. It features categorized room capacity tiers (Small, Medium, Large) operating between 10:00 and 24:00 (14 hourly slots). The system provides seamless online bookings for customers and operational schedule management for staff over a unified, real-time database with zero-conflict concurrency guarantees.

---

## 📚 Project Documentation

All formal software engineering specifications required for CPE 334 Deliverable 1 are maintained under the [`docs/`](./docs/) directory:

- [**Software Requirements Specification (SRS)**](./docs/srs.md): Product scope, actors, FR-01–FR-13, BR-01–BR-09, and NFR-01–NFR-05.
- [**Feature Catalog**](./docs/features.md): Baseline features F-01 through F-14 mapped across 3 sprints.
- [**Requirements Traceability Matrix**](./docs/traceability.md): 100% bidirectional traceability mapping requirements to verification IDs.
- [**System-Level Design Specification (SDS)**](./docs/system-sds.md): Decoupled architecture, ERD, database constraints, RBAC matrix, and API conventions.
- [**Three-Sprint Development Plan**](./docs/sprints/plan.md): 3-sprint roadmap and Sprint 1 feasibility justification.
- [**Sprint 1 Engineering Contracts**](./docs/sprints/sprint-1/contracts.md): API specifications, Acceptance Criteria (`AC-01`–`AC-06`), and Software Test Specifications (`TEST-01`–`TEST-05b`).
- [**Team & Agent Working Rules**](./AGENTS.md): Hardware memory guards (M1 8GB RAM), Git protocols, TDD rules, and UI layout conventions.
- [**AI Assistance Log**](./docs/ai-use.md): Continuous prompt and decision governance log.

---

## 🛠 Tech Stack (M1 8GB RAM Optimized)

- **Frontend:** React (Vite) + TypeScript + Tailwind CSS + Lucide Icons
- **Backend:** Node.js + Express.js (TypeScript) + RESTful JSON API
- **Persistence:** PostgreSQL / SQLite via Prisma ORM (Composite Unique Slot Constraints)
- **Testing:** Supertest + Jest (Serial in-band execution `--runInBand`)

---

## 🚀 Local Development Setup

*(Setup and execution commands will be updated as Sprint 1 implementation progresses).*
