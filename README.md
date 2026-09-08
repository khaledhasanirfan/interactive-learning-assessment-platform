# Interactive Learning & Assessment Platform
### Undergraduate Computer Science (CSE-307 Operating Systems)

A production-quality, responsive web platform designed for university students and instructors, featuring multi-type question banks, interactive hardware/OS scenario simulations (Paging Address Translation and Disk Head Scheduling), metacognitive confidence tracking, and privacy-preserving educational analytics.

---

## 1. Key Features

- **Extensible Question System:** 10 question types including Single MCQ, Multi-Select MCQ, True/False, Numeric with tolerance ($\pm \epsilon$), Short Text, Ordering/Sequencing, Matching, Scenario Simulation, Confidence Rating (1–5 Likert scale), and Qualitative Feedback.
- **Interactive Technical Scenario Engine:**
  - **Scenario A (Paging Address Translation):** Simulates CPU requests, MMU breakdown, Page Table lookup, physical frame mapping, and decimal/binary RAM address synthesis.
  - **Scenario B (Disk Scheduling):** Interactive horizontal cylinder track simulation comparing FCFS, SSTF, SCAN, and C-SCAN head movement trajectories.
- **Assessment Modes:**
  - *Assessment Mode:* Graded, timed, delayed feedback release, immutable version snapshots.
  - *Practice Mode:* Self-paced, unlimited attempts, instant step-by-step walkthroughs.
- **Educational Analytics & Gradebook:** Score histograms, question facility ($P$-value), average response times, and pseudonymized CSV exports.
- **Question Bank Import:** Real-time Zod schema validation and import from JSON / Gemini Notebook outputs.
- **Zero-Trust Security:** Deny-by-default Firestore rules, no client-side secret exposure, App Check ready, and server-side grading.

---

## 2. Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS (Academic palette: Navy/Slate, restrained blue accent, emerald/rose feedback)
- **Backend & Database:** Firebase Auth, Cloud Firestore, Firebase App Check, Firebase App Hosting
- **Validation:** Zod runtime validation
- **Analytics Visualization:** Recharts
- **Testing:** Vitest (Unit Tests), Playwright (E2E Tests)
- **Local Dev:** Firebase Emulator Suite

---

## 3. Quick Start Guide

### Prerequisites
- Node.js 20+ (Node 22 / 24 / 26 supported)
- npm 10+

### Installation & Local Setup

```bash
# 1. Clone the repository
git clone <repo-url>
cd "OS project"

# 2. Install dependencies
npm install

# 3. Environment configuration (pre-configured for local dev)
cp .env.example .env.local

# 4. Seed database with CSE-307 Course & Questions
npm run seed

# 5. Start the local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. Demo Personas & Testing Accounts

The platform includes a built-in top-bar persona switcher to explore both Student and Instructor views:

| Persona | Role | Email | Capabilities |
| :--- | :--- | :--- | :--- |
| **Prof. Alan Turing** | Instructor | `turing@university.edu` | Course creation, bank import, quiz publishing, analytics, CSV exports |
| **Ada Lovelace** | Student | `ada.lovelace@student.edu` | Course enrollment, quiz taking, scenario solving, practice sandbox |
| **Linus Torvalds** | Student | `linus.torvalds@student.edu` | Alternative student attempt telemetry |
| **Dennis Ritchie** | Admin | `admin@university.edu` | System oversight & role administration |

---

## 5. Scripts

- `npm run dev`: Starts the Next.js development server.
- `npm run build`: Builds the production bundle for Firebase App Hosting.
- `npm run test`: Runs the Vitest unit test suite (scenario algorithms & grading logic).
- `npm run test:e2e`: Runs Playwright end-to-end browser tests.
- `npm run typecheck`: Runs strict TypeScript compilation checks (`tsc --noEmit`).
- `npm run lint`: Runs ESLint checks.
- `npm run seed`: Seeds the sample question bank and course metadata.
- `npm run emulators`: Launches Firebase Auth and Firestore local emulators.

---

## 6. Project Architecture & Documentation

Comprehensive system documentation is located in the `docs/` directory:
- [docs/PRD.md](docs/PRD.md): Product Requirements Document
- [docs/architecture.md](docs/architecture.md): Next.js and Firebase Architecture
- [docs/data-model.md](docs/data-model.md): Firestore Data Schema and Indexing
- [docs/security-model.md](docs/security-model.md): RBAC Matrix and Firestore Rules
- [docs/testing-plan.md](docs/testing-plan.md): Quality Assurance and Testing Plan
- [docs/deployment.md](docs/deployment.md): Firebase App Hosting & DevOps Setup

---

## 7. Sample Question Bank

A sample question bank covering Operating Systems concepts is provided at:
`examples/os-question-bank.json`

It includes:
- Virtual Memory Paging MCQs
- TLB Effective Access Time Numeric Calculation
- Page Fault Trap Sequence Ordering
- Memory Allocation Best-Fit / Worst-Fit Matching
- Paging Address Translation Scenario
- Disk Scheduling Head Movement Scenario
- Metacognitive Confidence & Reflection Feedback
