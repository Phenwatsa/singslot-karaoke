# System-Level Software Design Specification (SDS)
## Project: SingSlot — Karaoke Room Reservation & Management System
**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents  
**Document Version:** 1.2.0 (Rigorous Engineering Baseline)  
**Date:** November 2026  

---

## 1. System Architecture & Tech Stack

SingSlot implements a **Decoupled Full-Stack Architecture** composed of three distinct logical tiers communicating over a RESTful JSON interface:

```
+-----------------------------------------------------------------------+
|                             Client Layer                              |
|   React (Vite) + TypeScript + Tailwind CSS + Lucide Icons             |
|   - Centralized Layout Shell: AppLayout, PageHeader, GlassCard        |
|   - Customer Portal: Catalog, Availability Grid, Online Booking, My Bookings |
|   - Staff Cashier Portal: Master Schedule Grid                        |
+----------------------------------+------------------------------------+
                                   | HTTP / HTTPS (RESTful JSON API)
                                   v
+----------------------------------+------------------------------------+
|                       API & Application Layer                         |
|   Node.js + Express.js (TypeScript)                                   |
|   - Auth & RBAC Middleware: verifyToken, requireRole('STAFF')         |
|   - Domain Services: BookingService, AvailabilityService, RoomService  |
|   - Validation & Concurrency Enforcement Engine                       |
+----------------------------------+------------------------------------+
                                   | Prisma ORM (Type-Safe Data Access)
                                   v
+----------------------------------+------------------------------------+
|                            Data Layer                                 |
|   PostgreSQL Relational Database (Primary Authoritative Engine)       |
|   - ACID Transactions via prisma.$transaction                         |
|   - Composite Unique Constraints: [roomId, bookingDate, slotIndex]    |
+-----------------------------------------------------------------------+
```

### 1.1 Stack Selection & Rationale
* **Primary Database:** **PostgreSQL** is established as the sole primary database engine to support ACID transaction isolation levels, row-level locking, and direct compatibility with Lab 5 Docker/GCP deployment.
* **Backend:** `Node.js + Express.js` provides lightweight, asynchronous request routing, strict validation pipelines, and authoritative business rule enforcement.
* **Frontend:** `React (Vite) + Tailwind CSS` delivers instant startup times and minimal memory footprint (<100MB) suited for MacBook M1 8GB RAM, while supporting modular layout components.

---

## 2. Data Model & Database Design

### 2.1 Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    USER ||--o{ BOOKING : places
    ROOM ||--o{ BOOKING : reserved_for
    ROOM ||--o{ ROOM_BLOCK : blocks
    BOOKING ||--|{ BOOKING_SLOT : allocates

    USER {
        string id PK
        string email UK
        string passwordHash
        string fullName
        string phone
        string role "CUSTOMER | STAFF"
        datetime createdAt
    }

    ROOM {
        string id PK
        string roomNumber UK "e.g., S01, M01, L01"
        string type "SMALL | MEDIUM | LARGE"
        int capacity "4, 8, 12"
        string description
        boolean isActive
    }

    BOOKING {
        string id PK
        string bookingCode UK "e.g., BK-20261110-001"
        string userId FK
        string roomId FK
        string bookingDate "YYYY-MM-DD (Asia/Bangkok)"
        int startSlot "0..13 (0=10:00)"
        int durationHours "1..5"
        int partySize
        string channel "ONLINE | WALK_IN"
        string customerName
        string customerPhone
        string status "CONFIRMED | CANCELLED"
        datetime createdAt
        datetime updatedAt
    }

    BOOKING_SLOT {
        string id PK
        string bookingId FK
        string roomId FK
        string bookingDate "YYYY-MM-DD"
        int slotIndex "0..13"
    }

    ROOM_BLOCK {
        string id PK
        string roomId FK
        string blockDate "YYYY-MM-DD"
        int slotIndex "0..13"
        string reason
        datetime createdAt
    }
```

### 2.2 Complete Prisma Schema Definition
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  CUSTOMER
  STAFF
}

enum RoomType {
  SMALL
  MEDIUM
  LARGE
}

enum BookingChannel {
  ONLINE
  WALK_IN
}

enum BookingStatus {
  CONFIRMED
  CANCELLED
}

model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String
  fullName     String
  phone        String?
  role         Role      @default(CUSTOMER)
  createdAt    DateTime  @default(now())
  bookings     Booking[]

  @@map("users")
}

model Room {
  id          String        @id @default(uuid())
  roomNumber  String        @unique
  type        RoomType
  capacity    Int
  description String?
  isActive    Boolean       @default(true)
  bookings    Booking[]
  blocks      RoomBlock[]

  @@map("rooms")
}

model Booking {
  id            String         @id @default(uuid())
  bookingCode   String         @unique
  userId        String
  roomId        String
  bookingDate   String         // Format: YYYY-MM-DD (Asia/Bangkok)
  startSlot     Int            // 0..13
  durationHours Int            // 1..5
  partySize     Int
  channel       BookingChannel @default(ONLINE)
  customerName  String
  customerPhone String?
  status        BookingStatus  @default(CONFIRMED)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  user          User           @relation(fields: [userId], references: [id], onDelete: Restrict)
  room          Room           @relation(fields: [roomId], references: [id], onDelete: Restrict)
  slots         BookingSlot[]

  @@index([bookingDate])
  @@index([userId])
  @@index([roomId])
  @@map("bookings")
}

model BookingSlot {
  id          String   @id @default(uuid())
  bookingId   String
  roomId      String
  bookingDate String   // Format: YYYY-MM-DD
  slotIndex   Int      // 0..13

  booking     Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  // Critical composite unique constraint: exactly one active slot per room-date-slot
  @@unique([roomId, bookingDate, slotIndex])
  @@index([bookingDate])
  @@map("booking_slots")
}

model RoomBlock {
  id        String   @id @default(uuid())
  roomId    String
  blockDate String   // Format: YYYY-MM-DD
  slotIndex Int      // 0..13
  reason    String?
  createdAt DateTime @default(now())

  room      Room     @relation(fields: [roomId], references: [id], onDelete: Cascade)

  @@unique([roomId, blockDate, slotIndex])
  @@index([blockDate])
  @@map("room_blocks")
}
```

### 2.3 Slot Identity, Invariants & Availability Calculation
* **Timezone & Granularity:** All booking calculations occur in the establishment's local timezone (`Asia/Bangkok`, ICT, UTC+7).
* **Slot Mapping (0..13):**
  * Slot 0: 10:00–11:00
  * Slot 1: 11:00–12:00
  * ...
  * Slot 13: 23:00–24:00
* **Data Invariant:** For all `BookingSlot` records, `BookingSlot.roomId` and `BookingSlot.bookingDate` must strictly equal the parent `Booking.roomId` and `Booking.bookingDate`. The application service layer transactionally validates and enforces this invariant upon record creation.
* **Cross-Table Conflict Prevention:** `BookingSlot` enforces `@@unique([roomId, bookingDate, slotIndex])` within confirmed bookings, and `RoomBlock` enforces `@@unique([roomId, blockDate, slotIndex])` within maintenance blocks. To prevent cross-table collisions, `BookingService` and `BlockService` verify that no active records exist in the opposing table within an atomic transaction.
* **Server-Calculated Availability Query:**
  When `GET /api/availability?date=YYYY-MM-DD` is executed, the server:
  1. Queries all active rooms from `Room`.
  2. Queries all `BookingSlot` records for the date where the parent `Booking.status == 'CONFIRMED'`.
  3. Queries all `RoomBlock` records for the date.
  4. Maps each room to 14 slots, setting `isAvailable: false` if a matching slot index exists in active `BookingSlot` or `RoomBlock`, otherwise `true`.
* **Cancellation Lifecycle (Sprint 2):**
  When a booking transitions to `CANCELLED`, its associated `BookingSlot` records are deleted within an atomic transaction. The parent `Booking` status remains `CANCELLED` for auditing, and the physical slots are immediately freed.

### 2.4 Pre-Seeded Dataset
The seed script (`npm run prisma:seed`) idempotently provisions:
* **Staff User:** `staff@singslot.local` / `Pass1234!` (`role: STAFF`)
* **Customer 1:** `customer1@singslot.local` / `Pass1234!` (`role: CUSTOMER`)
* **Customer 2:** `customer2@singslot.local` / `Pass1234!` (`role: CUSTOMER`)
* **Rooms (9 units):**
  * Small (Max 4): `S01`, `S02`, `S03`
  * Medium (Max 8): `M01`, `M02`, `M03`
  * Large (Max 12): `L01`, `L02`, `L03`
* **Pre-existing Reservation:** Room `S01` has Slot 3 (13:00–14:00) pre-reserved on test dates to provide a reproducible target for contiguous rejection test `TEST-04b`.

---

## 3. UI, API & Security Conventions

### 3.1 Role & Permission Matrix

| Endpoint | Method | Anonymous | Customer | Staff | Ownership / Access Guard Rule |
|---|:---:|:---:|:---:|:---:|---|
| `/api/auth/login` | POST | Allowed | Allowed | Allowed | Public authentication endpoint |
| `/api/auth/logout` | POST | Blocked | Allowed | Allowed | Discards token on client; server returns 200 |
| `/api/auth/me` | GET | Blocked | Allowed | Allowed | Returns authenticated caller's identity |
| `/api/rooms` | GET | Allowed | Allowed | Allowed | Public room fleet query |
| `/api/availability` | GET | Allowed | Allowed | Allowed | Public server-calculated availability |
| `/api/bookings/online` | POST | Blocked | Allowed | Blocked | Customer submits online reservation (`userId == req.user.id`) |
| `/api/bookings/my` | GET | Blocked | Allowed | Blocked | Returns strictly reservations where `userId == req.user.id` |
| `/api/bookings/:id` | GET | Blocked | Allowed | Allowed | **Ownership Check:** Returns 200 if `booking.userId == req.user.id` OR `req.user.role == 'STAFF'`; otherwise returns HTTP 403 Forbidden |
| `/api/bookings/master` | GET | Blocked | Blocked | Allowed | Staff inspects all bookings across all rooms |

### 3.2 Authentication & Session Lifecycle
1. **Password Verification:** Passwords are verified against `passwordHash` using `bcrypt.compare`.
2. **Token Issuance:** Upon authentication, the server signs a JWT containing payload: `{ sub: user.id, email: user.email, role: user.role }` with an 8-hour lifetime (`expiresIn: '8h'`).
3. **Session Transport:** Client transmits tokens via HTTP header: `Authorization: Bearer <token>`.
4. **Logout Semantics:** `POST /api/auth/logout` requires a valid token and responds with `{ "success": true, "message": "Logged out successfully" }`. The client clears the token from browser storage. *(Documented limitation: In Sprint 1, stateless JWT tokens expire after 8 hours; server-side token revocation tables are scheduled for Sprint 3)*.

### 3.3 Standard API Error Responses
All endpoints return consistent JSON error envelopes:
```json
{
  "success": false,
  "error": {
    "code": "SLOT_CONFLICT",
    "message": "One or more requested slots are already occupied."
  }
}
```

* **Standard Error Codes:**
  * `400 Bad Request`: `INVALID_INPUT`, `CANNOT_BOOK_PAST_SLOT`, `EXCEEDS_CAPACITY`, `INVALID_DURATION`
  * `401 Unauthorized`: `UNAUTHENTICATED`, `INVALID_CREDENTIALS`, `TOKEN_EXPIRED`
  * `403 Forbidden`: `FORBIDDEN`
  * `404 Not Found`: `ROOM_NOT_FOUND`, `BOOKING_NOT_FOUND`
  * `409 Conflict`: `SLOT_CONFLICT`, `CONCURRENT_LOCK_FAILED`

---

## 4. Configuration & Deployment Design

### 4.1 Environment Configuration
Externalized in `.env` (git-ignored, `.env.example` committed):
* `PORT`: Server port (default: `5001`).
* `DATABASE_URL`: `postgresql://postgres:postgres@localhost:5432/singslot_dev`
* `JWT_SECRET`: 256-bit cryptographic signing secret.
* `NODE_ENV`: `development` | `test` | `production`

### 4.2 Docker Packaging Plan (Lab 5 Alignment)
* Standalone backend container with PostgreSQL connection string injection.
* React client containerized and served via Nginx.
* Fully prepared for GCP Cloud Run and Cloud SQL deployment in Lab 5.
