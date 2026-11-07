# Sprint 1 Peer Review Record & Audit Trail

## Project: SingSlot — Karaoke Room Reservation & Management System

**Course:** CPE 334 Introduction to Software Engineering in the Age of AI Agents  
**Target:** Deliverable 1 (Sprint 1 Lean Delivery — The Golden Online Booking Slice)  
**Team Members:** @Phenwatsa & @lephirada (Equal Engineering Partners)

---

## 1. Peer Review Policy & Reciprocal Agreement

1. **Equal Reciprocal Review (No Self-Approval):** Both team members collaborate as equal partners. Every Pull Request targeted to `sprint-1-staging` must be reviewed and approved by the other partner.
2. **Substantive Technical Verification:** Reviews must verify Acceptance Criteria, code quality, M1 8GB RAM memory constraints, and reproducible test evidence.
3. **Continuous Chronological Logging:** Every PR review conversation, feedback, developer response, fixes applied, and final approval is logged sequentially in this document.

---

## 2. Summary of Sprint 1 Pull Requests

|  PR #   | Related Issue | Branch                                |   Author   |  Reviewer  | Review Status |      Verdict       |
| :-----: | :-----------: | ------------------------------------- | :--------: | :--------: | :-----------: | :----------------: |
| **#1**  | **Issue #1**  | `setup/issue-1-baseline-schema`       | @Phenwatsa | @lephirada | **Approved**  | **Ready to Merge** |
| **#2**  | **Issue #2**  | `feat/issue-2-auth-jwt-roles`         | @Phenwatsa | @lephirada | **Approved**  | **Ready to Merge** |
| **#9**  | **Issue #3**  | `feat/issue-3-room-availability-grid` | @Phenwatsa | @lephirada | **Approved**  | **Ready to Merge** |
| **#10** | **Issue #4**  | `feat/issue-4-booking-engine`         | @lephirada | @Phenwatsa | **Approved**  | **Ready to Merge** |
| **#11** | **Issue #5**  | `feat/issue-5-conflict-prevention`    | @lephirada | @Phenwatsa | **Approved**  | **Ready to Merge** |
| **#6**  | **Issue #6**  | `feat/issue-6-booking-views`          | @lephirada | @Phenwatsa |    Planned    |     _Upcoming_     |

---

## 3. Detailed Peer Review Logs

### 📌 PR #1: `setup(baseline): implement monorepo scaffolding, baseline schema, and layout shell [Issue #1]`

- **PR Link:** [https://github.com/Phenwatsa/singslot-karaoke/pull/1](https://github.com/Phenwatsa/singslot-karaoke/pull/1)
- **Author:** @Phenwatsa
- **Reviewer:** @lephirada
- **Source Branch:** `setup/issue-1-baseline-schema`
- **Target Branch:** `sprint-1-staging`
- **Verdict:** **Approved**

#### 🔍 Review Discussion

- **Reviewer (@lephirada):**

  > _"Reviewed the PR and its related files. The implementation, documentation, and tests meet the acceptance criteria. The remaining npm audit findings are documented as non-blocking follow-up work._
  > _Approved Ka."_
  - **Status:** **Approved**

- **Developer Response (@Phenwatsa):**

  > _"Thank you for the review and approval! All documentation and test logs have been updated. You can go ahead and merge this PR into `sprint-1-staging` now. 🎉"_

- **Outcome:** PR #1 approved for integration into `sprint-1-staging`.

---

### 📌 PR #8: `feat(auth): implement seeded JWT authentication, RBAC middleware and login modal [Issue #2]`

- **PR Link:** [https://github.com/Phenwatsa/singslot-karaoke/pull/8](https://github.com/Phenwatsa/singslot-karaoke/pull/8)
- **Author:** @Phenwatsa
- **Reviewer:** @lephirada
- **Source Branch:** `feat/issue-2-auth-jwt-roles`
- **Target Branch:** `sprint-1-staging`
- **Verdict:** **Approved**

#### 🔍 Review Discussion

- **Reviewer (@lephirada):**

  > _"Reviewed and approved. The implementation meets the Issue [#2](https://github.com/Phenwatsa/singslot-karaoke/issues/2) Acceptance Criteria for authentication, JWT-based sessions, role-based access control, and logout._
  > _Minor follow-ups:_
  > _- Improve JWT_SECRET cleanup in the auth tests when the original environment variable is undefined._
  > _- Add a client-side logout test to verify local storage and session state are cleared._
  > _- Consider validating restored tokens with /api/auth/me to handle expired sessions._
  > _These are non-blocking improvements and do not prevent approval."_
  - **Status:** **Approved**

- **Developer Response (@Phenwatsa):**

  > _"Thank you for the review and approval! Addressed all three minor follow-ups:_
  > _1. Fixed environment variable cleanup in `server/tests/auth.test.ts` to delete `process.env.JWT_SECRET` when `originalSecret` was originally undefined, preventing string 'undefined' leakage._
  > _2. Added client-side test in `client/tests/layout.test.mjs` verifying that logout removes both `singslot_token` and `singslot_user` from local storage and resets reactive session state._
  > _3. Enhanced `App.tsx` session restoration to validate restored tokens against `GET /api/auth/me`, immediately purging expired or invalid tokens from local storage._
  > _All 22 tests pass cleanly with `--runInBand`."_

- **Outcome:** PR #8 approved for integration into `sprint-1-staging`.

---

### 📌 PR #9: `feat(room): implement room catalog, availability calculation engine, and light theme [Issue #3]`

- **PR Link:** [https://github.com/Phenwatsa/singslot-karaoke/pull/9](https://github.com/Phenwatsa/singslot-karaoke/pull/9)
- **Author:** @Phenwatsa
- **Reviewer:** @lephirada
- **Source Branch:** `feat/issue-3-room-availability-grid`
- **Target Branch:** `sprint-1-staging`
- **Verdict:** **Approved**

#### 🔍 Review Discussion

- **Reviewer (@lephirada) — Initial Review:**

  > _"Request Changes_
  >
  > _The core Room Catalog and Server-Calculated Availability implementations are in place. However, a few items need to be addressed before approval:_
  > _1. Align the Availability Matrix status colors with the specified Green (Available), Red/Gray (Occupied/Closed) visual requirements while preserving the pastel theme._
  > _2. Clear stale availability data when the selected date changes and handle failed API requests with an appropriate error state._
  > _3. Extend TEST-03 to verify that all 9 rooms contain exactly 14 slots (indices 0–13)._
  > _4. Add test coverage for RoomBlock occupancy and ensure CANCELLED bookings are not treated as occupied._
  > _5. Synchronize the reported test counts between the PR description and docs/sprints/sprint-1/ai-use.md._
  > _6. Clarify that TEST-03 creates its booking fixture in beforeAll() rather than relying on a pre-seeded booking._
  > _Please address these items and update the verification results before requesting another review."_
  - **Status:** **Request Changes**

- **Developer Response (@Phenwatsa):**

  > Thanks @lephirada for the thorough final check! All 3 remaining items have been addressed:
  >
  > - Test Count Synchronized: Updated the PR description above to accurately reflect the latest 32/32 passing tests (22 server + 10 client), fully aligned with docs/sprints/sprint-1/ai-use.md and reviewer.md.
  > - Fixture Documentation Clarified: Updated the comments and test title in server/tests/availability.test.ts to state that TEST-03 verifies a dynamically test-created CONFIRMED booking fixture (TEST-FIX-SLOT3), removing any ambiguity about pre-seeded data.
  > - Empty Date Handling: Updated App.tsx to immediately clear stale availability data upon any date change, and if the date input is cleared (selectedDate === ''), display a clear 'Please select a valid date.' message instead of keeping stale availability on screen.
  >   Verification:
  >   npm run typecheck: 0 errors
  >   npm test: 32/32 tests passing (22 server + 10 client) in 1.86s
  >   npm run build: Succeeded in 1.3s

- **Reviewer (@lephirada) — Re-review & Approval:**

  > _"Approved. The implementation now satisfies the Issue [#3](https://github.com/Phenwatsa/singslot-karaoke/issues/3) Acceptance Criteria. The Room Catalog API returns the expected 9 rooms across the three capacity tiers, and the Availability API correctly calculates all 14 slots per room using CONFIRMED bookings and RoomBlock records. Date validation, frontend status colors, stale-data handling, and the previously requested test coverage have also been addressed. The TEST-03 fixture documentation and test counts are now consistent. Minor suggestion: consider making the availability test independent of unrelated pre-existing bookings to improve test isolation. Nice work!"_
  - **Status:** **Approved**

- **Developer Response (@Phenwatsa):**

  > _"Thank you @lephirada for the review, constructive suggestions, and approval! Noted the minor suggestion regarding complete independence from unrelated bookings for future test isolation enhancements. PR #9 is now ready to merge into `sprint-1-staging`."_

- **Outcome:** PR #9 approved for integration into `sprint-1-staging`.

---

### 📌 PR #10: `feat: add online booking engine and reservation management with contiguous validation [Issue #4]- #10`

- **PR Link:** [https://github.com/Phenwatsa/singslot-karaoke/pull/10](https://github.com/Phenwatsa/singslot-karaoke/pull/10)
- **Author:** @lephirada
- **Reviewer:** @Phenwatsa
- **Source Branch:** `feat/issue-4-booking-engine`
- **Target Branch:** `sprint-1-staging`
- **Verdict:** **Approved**

#### 🔍 Review Discussion

- **Reviewer (@Phenwatsa):**

  > The implementation of Issue #4 looks good.The backend correctly validates the operating window, duration, past-time slots in Asia/Bangkok, room capacity, and contiguous availability. Booking and BookingSlot records are created within a single Prisma transaction, with unique-constraint handling for slot conflicts.The frontend booking journey is also properly integrated, including room/slot selection, duration preview, validation feedback, and reservation confirmation.The automated tests cover the main acceptance criteria:
  >
  > - **TEST-04a:** Valid 1-, 3-, and 5-hour bookings with persisted records.
  > - **TEST-04c:** Past-date and elapsed-slot rejection.
  > - **TEST-04d:** Party size exceeding room capacity.
  > - **TEST-04f:** Transaction rollback with no orphaned records.
  >   Minor recommendations:
  > - Consider adding a dedicated test for booking a slot that is occupied by a RoomBlock.
  > - Consider providing frontend feedback for elapsed slots on the current Bangkok date before submission.
  >   Please ensure the latest test, typecheck, and build results are available as verification evidence.
  >   These recommendations are non-blocking.
  >   Approving this PR.
  - **Status:** **Approved**

- **Developer Response (@lephirada):**

  > _"Thank you @Phenwatsa for the thorough review, constructive recommendations, and approval! Both non-blocking items have been fully addressed and verified:_
  > _1. **RoomBlock Conflict Test (BR-02):** Added a dedicated integration test in `server/tests/booking.test.ts` confirming that booking attempts overlapping an active `RoomBlock` are rejected with HTTP 409 `SLOT_CONFLICT` with zero database modifications._
  > _2. **Frontend Same-Day Elapsed Slot Guard:** Added `isPastBangkokSlot` in `client/src/utils/date.ts` and integrated it into `BookingModal.tsx` to automatically disable elapsed slots on the current Bangkok date with `(Elapsed)` indicators and prevent invalid form submissions._
  > _All 54 tests (43 server + 11 client) pass cleanly in ~2.3s with `--runInBand`, and typecheck and build pass with 0 errors. PR #10 is ready for merge into `sprint-1-staging`."_

- **Outcome:** PR #10 approved for integration into `sprint-1-staging`.

---

### 📌 PR #11: `feat(booking): verify conflict prevention, TDD contiguous rule, and concurrency protection [Issue #5]`

- **PR Link:** [https://github.com/Phenwatsa/singslot-karaoke/pull/11](https://github.com/Phenwatsa/singslot-karaoke/pull/11)
- **Author:** @lephirada
- **Reviewer:** @Phenwatsa
- **Source Branch:** `feat/issue-5-conflict-prevention`
- **Target Branch:** `sprint-1-staging`
- **Verdict:** **Approved**

#### 🔍 Review Discussion

- **Reviewer (@Phenwatsa):**

  > _"The implementation satisfies the required conflict prevention and concurrency protection criteria._
  >
  > _TEST-04b verifies that booking across a pre-seeded occupied slot returns HTTP 409 SLOT_CONFLICT without creating additional bookings or booking slots._
  > _The Red–Green commits demonstrate the behavior before and after restoring application-level interval validation. The Red-phase failure confirms that disabling this validation causes the request to reach the database-level conflict handler instead._
  > _TEST-04e uses Promise.all to simulate competing requests and verifies exactly one HTTP 201 response and one HTTP 409 response, along with the persisted booking and slot ownership._
  > _The PostgreSQL composite unique constraint @@unique([roomId, bookingDate, slotIndex]) is present and directly verified through a duplicate insertion test._
  > _Test cleanup is appropriately scoped to records created by this test suite._
  > _The attached test evidence reports 57/57 passing tests, with typecheck and production build also reported as successful._
  >
  > _No blocking issues were found within the scope of this PR._
  >
  > _Recommendation: Approve."_
  - **Status:** **Approved**

- **Developer Response (@lephirada):**

  > _"Thank you @Phenwatsa for the thorough review and official approval! All conflict prevention requirements, concurrency protections, multi-layered database constraints, and TDD evidence cycles have been verified with 100% test pass rate (57/57 tests). PR #11 is ready to merge into `sprint-1-staging`."_

- **Outcome:** PR #11 approved for integration into `sprint-1-staging`.
