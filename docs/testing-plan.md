# Quality Assurance & Testing Plan
## Interactive Learning & Assessment Platform

---

## 1. Testing Strategy Pyramid
Our quality assurance strategy ensures correctness across four foundational tiers:
1. **Unit Tests (Vitest):** Fast, deterministic tests for all scenario mathematics, scheduling algorithms, and schema validations.
2. **Security Rules Unit Tests (@firebase/rules-unit-testing):** Verifies that student privilege escalation, unauthorized reads of drafts/answer keys, and tampering with locked attempts are rejected by Firestore emulator.
3. **Component Tests (Testing Library / Vitest):** Validates accessible interactions, keyboard navigation, and scenario visualizer rendering.
4. **End-to-End Tests (Playwright):** Full automated browser simulations covering core Student and Instructor journeys in realistic classroom scenarios.

---

## 2. Unit Testing Matrix (Vitest)

### 2.1 Scenario Evaluation Engines
- **Paging Address Translation (`lib/scenarios/paging/`):**
  - Verify binary conversion for arbitrary process and page sizes (e.g. 4B process, 2B page, 16B physical memory).
  - Verify page number and offset bit-mask extraction.
  - Verify page table lookup handling (Page 0 $\rightarrow$ Frame 2, Page 1 $\rightarrow$ Frame 4).
  - Verify physical address synthesis and decimal conversion (e.g., logical address 3 $\rightarrow$ physical address 9).
  - Test edge cases: address 0, maximum valid address, invalid addresses outside process space.
- **Disk Scheduling Algorithms (`lib/scenarios/disk/`):**
  - **FCFS:** Correct sequence order matching input queue; exact total head movement calculation.
  - **SSTF:** Correct greedy closest-track resolution; tie-breaking consistency; head movement tally.
  - **SCAN (Elevator):** Proper directional sweep toward boundary cylinder (e.g. 199 or 0), reversal, and movement count.
  - **C-SCAN (Circular SCAN):** Sweep in one direction, jump to start cylinder (0), continuation, and standard head movement computation.

### 2.2 Question Validation & Runtime Schemas (`lib/validations/`)
- Zod schema validation for all 10 question types.
- Numeric answer tolerance checks (exact vs $\pm \epsilon$).
- Sanitization utilities ensuring secret answer keys are stripped from client payloads.

---

## 3. Firestore Security Rules Unit Tests
Using `@firebase/rules-unit-testing` against the local Firestore Emulator:
- [x] Unauthenticated user cannot read any private document.
- [x] Student cannot read questions or answer keys directly from `/questionBanks`.
- [x] Student can create an attempt for a course they belong to, with `status: 'in-progress'`.
- [x] Student cannot create an attempt with `status: 'submitted'` directly.
- [x] Student cannot update an attempt once it is marked `submitted`.
- [x] Student cannot read another student's attempt or response subcollection.
- [x] Instructor can read all attempts belonging to their own courses.
- [x] Instructor cannot modify or delete attempts in courses they do not teach.
- [x] User cannot change their own role in `/users/{userId}` to `instructor` or `admin`.

---

## 4. End-to-End (E2E) Test Suite (Playwright)

### 4.1 Journey 1: Instructor Course & Assessment Lifecycle
1. Instructor logs in.
2. Navigates to Courses $\rightarrow$ creates "CSE-307: Operating System".
3. Navigates to Question Banks $\rightarrow$ imports `examples/os-question-bank.json`.
4. Previews validated questions (paging MCQ, numeric translation, disk scheduling).
5. Creates a new Quiz $\rightarrow$ selects questions $\rightarrow$ configures practice vs assessment mode.
6. Publishes quiz (verifying immutable snapshot creation).
7. Inspects analytics dashboard and downloads exported response CSV.

### 4.2 Journey 2: Student Learning & Quiz Completion
1. Student registers/logs in.
2. Enrolls in "CSE-307" using the 6-character course enrollment code.
3. Views available quizzes on student dashboard.
4. Starts attempt $\rightarrow$ navigates through questions:
   - Answers MCQ.
   - Solves Paging Address Translation scenario.
   - Solves Disk Scheduling scenario with cylinder head path.
   - Provides confidence rating (1-5).
5. Verifies autosave behavior on page refresh.
6. Confirms submission modal $\rightarrow$ attempt state transitions to `submitted`.
7. Checks results and explanations when permitted.

---

## 5. Accessibility (a11y) & Performance Auditing
- Playwright `@axe-core/playwright` integration on all main routes (`/`, `/student/dashboard`, `/student/quizzes/[id]`, `/instructor/dashboard`).
- Zero critical or serious WCAG 2.1 AA violations.
- Tab-order and focus visibility verified on interactive scenario visualizers.
- Color-blind check ensuring all correctness feedback combines colors with badges/icons.
