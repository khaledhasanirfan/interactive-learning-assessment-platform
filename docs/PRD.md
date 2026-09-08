# Product Requirements Document (PRD)
## Interactive Learning & Assessment Platform

**Working Name:** Interactive Learning & Assessment Platform  
**Target Course:** Undergraduate Computer Science (Initially: CSE-307 Operating Systems)  
**Architecture Principle:** Modular, course-agnostic core with extensible domain scenario engines.

---

## 1. Executive Summary & Problem Statement
Undergraduate Computer Science courses (such as Operating Systems, Architecture, and Networks) require deep conceptual understanding of dynamic, state-driven mechanisms (e.g., paging, disk head scheduling, process synchronization, cache lines). Traditional static assessment platforms (such as basic LMS quizzes) fail to capture intermediate reasoning, lack interactive visual simulations, and fail to collect educational feedback like student confidence ratings and time-per-question analytics.

This platform bridges that gap by providing:
1. An extensible multi-type question assessment engine.
2. High-fidelity, deterministic interactive technical scenario modules with visual models (starting with Paging Address Translation and Disk Scheduling).
3. Dual-mode execution: Self-paced practice mode with immediate formative feedback vs. secure assessment mode with delayed post-deadline feedback.
4. Privacy-preserving educational analytics with honest statistical representations (displaying sample size, distributions, and discrimination indices without pseudo-scientific overclaims).
5. Robust, tamper-proof security and role separation (Student, Instructor, Admin) backed by Firebase Authentication, Cloud Firestore, and Firebase App Check.

---

## 2. User Roles & Personas

### 2.1 Student
- **Goals:** Enroll in authorized courses via secure invitation or class code, practice conceptual technical problems, take scheduled assessments with autosaved state, view feedback and explanations when released, and calibrate metacognition via confidence self-ratings (1-5 scale).
- **Security Boundary:** May only view published/active quizzes in enrolled courses; cannot access answer keys, unpublished drafts, fellow student submissions, aggregate class metrics, or raw question banks. Cannot escalate privileges.

### 2.2 Instructor
- **Goals:** Manage courses, sections, and student rosters; curate tagged question banks; construct quizzes with customizable assessment parameters (attempts, time limits, feedback modes, option shuffling); assign quizzes to specific sections; inspect real-time submissions; view question- and student-level analytics; export anonymized/pseudonymized response CSVs.
- **Security Boundary:** May only create and edit content within courses where they are designated as `instructorIds`. Cannot tamper with other instructors' courses unless granted administrative oversight.

### 2.3 System Administrator
- **Goals:** Provision instructor accounts, audit system-wide course allocations, manage security policies, and monitor platform health and data retention compliance.

---

## 3. Key Functional Requirements

### 3.1 Course & Roster Management
- **Course Metadata:** Course code (e.g., `CSE-307`), title (e.g., `Operating System`), semester (`Spring 2026`), academic year, institution, description, instructor list.
- **Sections:** Support for multiple sections (e.g., Section A, Section B) with section-specific assignment scheduling.
- **Enrollment Flow:** 
  - Unique alphanumeric 6-character class codes for student self-enrollment (which exclusively grant Student privileges).
  - Direct instructor email invitation/enrollment.
  - Roster management (viewing active students, removing unauthorized enrollments).

### 3.2 Question Bank & Versioning Engine
- **Extensible Question Types:**
  1. Single-choice MCQ (with option shuffling support)
  2. Multiple-select MCQ (partial credit or all-or-nothing evaluation)
  3. True / False
  4. Numeric Answer (with configurable tolerance $\pm \epsilon$)
  5. Short Text Answer (regex / exact match normalization)
  6. Ordering / Sequencing (drag-and-drop / index input)
  7. Matching (key-value pairing)
  8. Scenario-Based Interactive Question (dynamic state generator + interactive visualization + multi-step evaluation)
  9. Metacognitive Confidence Rating (post-answer Likert scale 1–5)
  10. Open-ended Metacognitive Feedback ("What was confusing about this question?")
- **Immutable Published Versions:**
  - When a quiz is published, a snapshot `quizVersion` is created with an immutable deep copy of all referenced questions.
  - Edits made by instructors to the original question bank or draft quizzes *never* invalidate or alter in-flight or historic student attempts.

### 3.3 Interactive Scenario Engine
- Pluggable scenario architecture with unified interface:
  - `ScenarioConfig`: Static parameters defined by the instructor.
  - `ScenarioState`: Generated randomized or fixed problem instance.
  - `StudentInput`: Structured answer submitted by the student.
  - `Evaluator`: Pure, deterministic evaluation function returning correctness, points, step-by-step breakdown, and explanation.
  - `Visualizer`: Interactive, responsive, accessible SVG/Canvas/DOM component (not relying solely on animation; fully legible as static visual state).
- **Initial OS Scenario Modules:**
  - **Module A: Paging Address Translation:**
    - Configurable process size, page size, physical memory size, frame size, and page table mapping.
    - Step-by-step translation: Logical address $\rightarrow$ binary representation $\rightarrow$ [Page # | Offset] split $\rightarrow$ Page table lookup $\rightarrow$ [Frame # | Offset] physical address $\rightarrow$ binary to decimal translation.
    - Schematic visualization: CPU $\rightarrow$ Logical Address $\rightarrow$ MMU $\rightarrow$ Page Table $\rightarrow$ Physical Address $\rightarrow$ RAM Frame.
  - **Module B: Disk Scheduling:**
    - Configurable cylinder range (e.g., 0–199), initial head position, request queue, and algorithm (FCFS, SSTF, SCAN, C-SCAN).
    - Student tasks: Predict next serviced track, complete sequence order, compute total head movement (cylinders traversed).
    - Visualization: Horizontal cylinder track with head pointer and path trace.

### 3.4 Assessment & Practice Flow
- **Modes:**
  - *Assessment Mode:* Enforced deadlines, optional countdown timer, attempt caps, delayed feedback until closed, randomized question/option ordering.
  - *Practice Mode:* Unlimited attempts, immediate correctness check, immediate step-by-step explanation, confidence rating prompts.
- **Autosave & Fault Tolerance:**
  - Client state continually synced to Firestore/Local Cache.
  - Network interruption recovery without response loss.
  - Idempotent final submission guard (prevents double submissions or race conditions).

### 3.5 Question Bank Import & Export
- Import question banks via structured JSON and standard CSV formats.
- Pre-import validation engine using Zod with line-by-line syntax and schema error reporting.
- Preview modal displaying validated questions before database persistence.
- Bundled starter seed: `examples/os-question-bank.json` covering OS concepts (paging, address translation, TLB, disk scheduling, page faults).

### 3.6 Educational Analytics & Reporting
- **Quiz Level:** Total attempts, completion rate, mean/median scores, standard deviation, score distribution histogram, average time-to-completion.
- **Question Level:** Facility value / difficulty index ($P$-value), average response time, option distribution histogram (distractor analysis), confidence vs. correctness cross-tabulation.
- **Student Level:** Individual attempt timeline, topic mastery radar, confidence calibration curve (overconfidence vs. underconfidence identification).
- **Statistical Discipline:** Explicitly annotating sample sizes ($N$) and avoiding misleading conclusions on small cohorts ($N < 15$).
- **CSV Export:** Pseudonymized student response data exportable for LMS gradebooks or research analysis.

---

## 4. Non-Functional Requirements

### 4.1 Security & Integrity
- Zero trust client model: Grading, score tallying, and answer key exposure are strictly controlled via server actions or delayed Firestore security rules.
- Custom claims for role enforcement (`admin`, `instructor`).
- Firebase App Check enabled with reCAPTCHA v3 / Enterprise to reject automated scraping or bot submissions.
- Deny-by-default Firestore rules. No raw answer keys delivered to the client during active assessment mode.

### 4.2 Accessibility (WCAG 2.1 AA)
- Full keyboard navigation for all interactive controls (including scenario components and question ordering).
- Semantic HTML tags and WCAG-compliant color contrast ratios (minimum 4.5:1 for body text, 3:1 for UI elements).
- Color-blind friendly status indicators (never rely exclusively on red/green; always combine with iconography and clear text labels).
- Visible focus outlines and screen-reader accessible ARIA labels.

### 4.3 Performance & Classroom Scale
- Capable of supporting concurrent submissions from 200+ students in a single lecture hall.
- Subcollection isolation to avoid document size limits (Firestore 1MB limit) and write contention.
- Lazy-loaded scenario visualizers to maintain lightweight initial bundle sizes.

---

## 5. Educational Data Privacy & Ethics
- Minimization of PII: Only name and institutional email collected via Firebase Auth. No biometric, hardware fingerprinting, or intrusive tracking.
- Transparency: Clear notice to students detailing what telemetry is logged (response times, confidence ratings, question answers).
- Research disclaimer: If educational data is repurposed for pedagogical scholarship, institutional IRB/ethics approval and student consent toggles are documented and supported.
