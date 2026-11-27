# System-Level Software Design Specification (SDS)
## Project: SingSlot — Karaoke Room Reservation & Management System
**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents  
**Document Version:** 1.4.0 (Deliverable 2 Integrated Release Candidate — Sprint 1 + Lab 7 + Sprint 2 + F-11)  
**Date:** 27 November 2026  

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
        int hourlyRate "THB/hr: 200, 350, 500"
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
        int durationHours "1..5 (1..3 overlapping Peak 8..11)"
        int partySize
        int totalPrice "Authoritative hourlyRate * durationHours (THB)"
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
  id           String        @id @default(uuid())
  roomNumber   String        @unique
  type         RoomType
  capacity     Int
  hourlyRate   Int           @default(200) // THB/hour: SMALL=200, MEDIUM=350, LARGE=500 (BR-12)
  description  String?
  isActive     Boolean       @default(true)
  bookings     Booking[]
  bookingSlots BookingSlot[]
  blocks       RoomBlock[]

  @@map("rooms")
}

model Booking {
  id            String         @id @default(uuid())
  bookingCode   String         @unique
  userId        String
  roomId        String
  bookingDate   String         // Format: YYYY-MM-DD (Asia/Bangkok)
  startSlot     Int            // 0..13
  durationHours Int            // 1..5 (1..3 when overlapping Peak slots 8..11 for ONLINE)
  partySize     Int
  totalPrice    Int            @default(0) // Authoritative server-computed room.hourlyRate * durationHours (BR-12)
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
  room        Room     @relation(fields: [roomId], references: [id], onDelete: Restrict)

  // Composite unique constraint: exactly one active booking slot per room-date-slot
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
* **Cross-Table & Multi-Room Quota Concurrency Protection Strategy (Rev. Lab 7):** While separate composite unique constraints enforce uniqueness within `BookingSlot` (`@@unique([roomId, bookingDate, slotIndex])`) and `RoomBlock` (`@@unique([roomId, blockDate, slotIndex])`) independently, both cross-table collisions (`BR-02`, `DEF-SS-01`) and cross-room daily customer hour quota races (`BR-11`) under PostgreSQL's default `READ COMMITTED` isolation level are eliminated using deterministic pessimistic row-level locks acquired in a strict global lock order (`users` $\rightarrow$ `rooms`) inside `prisma.$transaction`:
  ```sql
  -- Step 1 (Online bookings enforcing BR-11): Lock customer row first to serialize cross-room quota checks
  SELECT "id" FROM "users" WHERE "id" = $targetUserId FOR UPDATE;

  -- Step 2 (All booking & RoomBlock mutations enforcing BR-02 / BR-06): Lock target room row
  SELECT "id" FROM "rooms" WHERE "id" = $targetRoomId FOR UPDATE;
  ```
  Locking `users` before `rooms` prevents circular wait deadlocks while guaranteeing that two concurrent online requests by the same customer targeting **different rooms** on the same `bookingDate` serialize their `SUM(durationHours)` check (`<= 6` hours) and cannot bypass `BR-11`. Conflicting slot claims fail safely with HTTP 409 `SLOT_CONFLICT`, and quota violations fail safely with HTTP 409 `DAILY_QUOTA_EXCEEDED`.
* **Server-Calculated Availability Query (Rev. Lab 7):**
  When `GET /api/availability?date=YYYY-MM-DD` is executed, the server:
  1. Queries all active rooms from `Room` (including `hourlyRate`).
  2. Queries all `BookingSlot` records for the date where the parent `Booking.status == 'CONFIRMED'`.
  3. Queries all `RoomBlock` records for the date.
  4. Maps each room to 14 slots, computing:
     - `isOccupied`: `true` if a matching slot index exists in active `BookingSlot` or `RoomBlock`.
     - `isPast`: `true` if `currentServerTime >= slotStartTime` in `Asia/Bangkok`.
     - `isWithinCutoff`: `true` if `currentServerTime > slotStartTime - 60 minutes` in `Asia/Bangkok` (`BR-04`).
     - `isAvailable`: `!isOccupied && !isWithinCutoff` (authoritative **online customer** bookability).
     - **Staff Walk-in Semantics (`F-07`):** Because `isAvailable` incorporates the 60-minute online cutoff, future Staff on-premise walk-in availability checks MUST evaluate `!isOccupied && !isPast` rather than relying on `isAvailable`.
* **Authoritative Pricing & Additive Schema Evolution (`BR-12`):**
  `Room.hourlyRate` (`@default(200)`) and `Booking.totalPrice` (`@default(0)`) are introduced via an additive, rollback-safe Prisma migration with SQL backfill (`SMALL=200`, `MEDIUM=350`, `LARGE=500`; historical `bookings.totalPrice = bookings.durationHours * rooms.hourlyRate`). Server controllers always compute `totalPrice = room.hourlyRate * durationHours` and ignore any client-provided price field.
* **Cancellation Lifecycle (Sprint 2):**
  When a booking transitions to `CANCELLED`, its associated `BookingSlot` records are deleted within an atomic transaction. The parent `Booking` status remains `CANCELLED` for auditing, and the physical slots are immediately freed.

### 2.4 Seed Dataset vs. Deterministic Test Fixtures
* **Idempotent Seed Script (`npm run prisma:seed`):** Provisions exclusively the 3 demo user accounts and 9 rooms with bcrypt password hashes. It does **not** insert mock reservations, keeping development and demo environments clean and predictable.
* **Deterministic Test Fixtures:** Automated test suites requiring pre-occupied slots (such as `TEST-04b` testing contiguous conflict rejection) programmatically create and clean up their own isolated reservations on a designated test date (`2026-11-10`) during test lifecycle hooks (`beforeAll`/`afterAll`), ensuring clean decoupling from production-like demo data.

---

## 3. UI, API & Security Conventions

### 3.1 Role & Permission Matrix

| Endpoint | Method | Anonymous | Customer | Staff | Ownership / Access Guard Rule |
|---|:---:|:---:|:---:|:---:|---|
| `/api/auth/register` | POST | Allowed | Allowed | Allowed | Public customer self-registration (`F-11`); forces `role = CUSTOMER` and hashes password with `bcrypt` (`>= 10` rounds) |
| `/api/auth/login` | POST | Allowed | Allowed | Allowed | Public authentication endpoint |
| `/api/auth/logout` | POST | Blocked | Allowed | Allowed | Discards token on client; server returns 200 |
| `/api/auth/me` | GET | Blocked | Allowed | Allowed | Returns authenticated caller's identity |
| `/api/rooms` | GET | Allowed | Allowed | Allowed | Public room fleet query (with `hourlyRate`) |
| `/api/availability` | GET | Allowed | Allowed | Allowed | Public server-calculated availability (`isWithinCutoff`, `isPast`, `hourlyRate`) |
| `/api/bookings/online` | POST | Blocked | Allowed | Blocked | Customer submits online reservation (`userId == req.user.id`, Lab 7 rules & `BR-12` `totalPrice`) |
| `/api/bookings/walk-in` | POST | Blocked | Blocked | Allowed | Staff walk-in counter (`F-07`, `!isPast` only, exempt from online-only Lab 7 rules) |
| `/api/bookings/my` | GET | Blocked | Allowed | Blocked | Returns strictly reservations where `userId == req.user.id` |
| `/api/bookings/:id` | GET | Blocked | Allowed | Allowed | **Ownership Check:** Returns 200 if `booking.userId == req.user.id` OR `req.user.role == 'STAFF'`; otherwise returns HTTP 403 Forbidden |
| `/api/bookings/:id/cancel` | PATCH | Blocked | Allowed | Allowed | **Ownership & `BR-09`:** Owner or `STAFF` only (`>= 24h` prior); sets `CANCELLED` & releases `BookingSlot` rows |
| `/api/bookings/:id/reschedule` | PATCH | Blocked | Allowed | Allowed | **Ownership & `BR-09`:** Owner or `STAFF` only (`>= 24h` prior); recalculates `totalPrice`, excludes `targetBookingId` from `BR-11` |
| `/api/bookings/master` | GET | Blocked | Blocked | Allowed | Staff inspects/filters all bookings across all rooms (`F-06`, `F-10`) |
| `/api/room-blocks` | GET / POST | Blocked | Blocked | Allowed | Staff lists or creates maintenance blocks (`F-09`, `BR-10`: `409 BLOCK_CONFLICT`) |
| `/api/room-blocks/:id` | DELETE | Blocked | Blocked | Allowed | Staff removes maintenance block (`F-09`) |

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
  * `400 Bad Request`: `INVALID_INPUT`, `CANNOT_BOOK_PAST_SLOT`, `EXCEEDS_CAPACITY`, `INVALID_DURATION`, `PEAK_DURATION_EXCEEDED`, `CANCELLATION_WINDOW_EXPIRED`
  * `401 Unauthorized`: `UNAUTHENTICATED`, `INVALID_CREDENTIALS`, `TOKEN_EXPIRED`
  * `403 Forbidden`: `FORBIDDEN`
  * `404 Not Found`: `ROOM_NOT_FOUND`, `BOOKING_NOT_FOUND`, `NOT_FOUND`
  * `409 Conflict`: `SLOT_CONFLICT`, `DAILY_QUOTA_EXCEEDED`, `CONCURRENT_LOCK_FAILED`, `BLOCK_CONFLICT`, `BLOCK_ALREADY_EXISTS`, `BOOKING_ALREADY_CANCELLED`, `EMAIL_ALREADY_EXISTS`

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
