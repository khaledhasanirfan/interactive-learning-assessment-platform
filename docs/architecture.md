# System Architecture Document
## Interactive Learning & Assessment Platform

---

## 1. Architectural Overview

The platform uses a modern, modular JAMstack/Serverless architecture built upon **Next.js 15 (App Router)** and **Firebase Cloud Infrastructure** (Authentication, Firestore, Storage, App Check, App Hosting).

```
 +-------------------------------------------------------------------------+
 |                          Client Tier (Browser)                          |
 |  - Student Assessment UI     - Instructor Management / Authoring UI     |
 |  - Scenario Visualizers (DOM/SVG)  - Analytics & Charts (Recharts)      |
 +--------------------+-------------------------------+--------------------+
                      |                               |
           HTTPS/WSS  |                               | HTTPS (App Check)
                      v                               v
 +--------------------+-----------+     +-------------+--------------------+
 |       Next.js App Router       |     |        Firebase Services         |
 |  - Server Components (RSC)     |     |  - Firebase Auth (JWT / Claims)  |
 |  - Server Actions (Grading)    |     |  - Cloud Firestore (Rules Deny)  |
 |  - API Routes (CSV / AI Ops)   |     |  - Firebase Storage (Assets)     |
 |  - Zod Runtime Validations     |     |  - Firebase App Check            |
 +--------------------+-----------+     +-------------+--------------------+
                      |                               |
                      +---------------+---------------+
                                      |
                                      v
                        +-------------+---------------+
                        | Firebase App Hosting Engine |
                        | (Managed Cloud Run & CDN)   |
                        +-----------------------------+
```

---

## 2. Directory & Component Structure

```
.
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (student)/
│   │   ├── student/dashboard/page.tsx
│   │   ├── student/courses/[courseId]/page.tsx
│   │   └── student/quizzes/[quizId]/attempt/[attemptId]/page.tsx
│   ├── (instructor)/
│   │   ├── instructor/dashboard/page.tsx
│   │   ├── instructor/courses/page.tsx
│   │   ├── instructor/courses/[courseId]/page.tsx
│   │   ├── instructor/banks/page.tsx
│   │   ├── instructor/quizzes/page.tsx
│   │   ├── instructor/quizzes/[quizId]/edit/page.tsx
│   │   ├── instructor/scenarios/page.tsx
│   │   └── instructor/analytics/[quizId]/page.tsx
│   ├── api/
│   │   ├── export/responses/route.ts
│   │   ├── import/questions/route.ts
│   │   └── ai/misconceptions/route.ts  (Optional AI abstraction)
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/             # Accessible atomic UI components (Button, Modal, Card, Input, Tabs)
│   ├── layout/         # Navigation, Sidebar, RoleGuard, Header
│   ├── questions/      # Question renderers and authoring editors per question type
│   ├── scenarios/      # Plug-and-play scenario engines (Paging, Disk Scheduling)
│   └── analytics/      # Recharts visualizers, difficulty distributions, confidence tables
├── lib/
│   ├── firebase/
│   │   ├── client.ts   # Client-side Firebase SDK & App Check init
│   │   ├── admin.ts    # Server-side Firebase Admin SDK init
│   │   └── auth.ts     # Role extraction, token parsing, custom claims
│   ├── scenarios/      # Core scenario registry and abstract definitions
│   │   ├── registry.ts
│   │   ├── paging/     # Paging address translation engine
│   │   └── disk/       # Disk scheduling engine
│   ├── validations/    # Zod schemas (Question, Quiz, Attempt, Course, User)
│   ├── grading/        # Pure grading engines & server-side assessment evaluators
│   └── ai/             # Optional AI abstraction layer
├── docs/               # System documentation & architectural records
├── tests/              # Vitest unit tests, Playwright E2E tests, Firestore rule tests
├── firestore.rules     # Strict, deny-by-default security rules
├── firestore.indexes.json
├── firebase.json       # Emulators, hosting & App Hosting config
└── apphosting.yaml     # Firebase App Hosting deployment specification
```

---

## 3. Core Engine Subsystems

### 3.1 Scenario Engine Plugin Architecture
To prevent scenario logic from becoming tightly coupled or hardcoded, all scenario activities adhere to the strict `IScenarioPlugin` contract:

```typescript
export interface IScenarioPlugin<TConfig, TState, TInput, TResult> {
  type: string;
  name: string;
  description: string;
  
  // Default configuration when an instructor instantiates the scenario
  defaultConfig: TConfig;
  
  // Generates randomized or deterministic problem instance parameters
  generateState(config: TConfig, seed?: string | number): TState;
  
  // Pure function to grade student input against the problem instance
  evaluate(state: TState, input: TInput, config: TConfig): TResult;
  
  // Generates complete pedagogical explanation for post-assessment review
  explain(state: TState, config: TConfig): string;
  
  // React Visualizer component rendering the state and accepting input
  Visualizer: React.ComponentType<ScenarioVisualizerProps<TState, TInput>>;
  
  // React Authoring/Config component for instructors
  ConfigEditor: React.ComponentType<ScenarioConfigEditorProps<TConfig>>;
}
```

#### Plugin Registration:
New scenarios (e.g., CPU Scheduling, Page Replacement, Banker's Algorithm) are simply registered in `lib/scenarios/registry.ts`:
```typescript
ScenarioRegistry.register('paging-translation', PagingScenarioPlugin);
ScenarioRegistry.register('disk-scheduling', DiskSchedulingScenarioPlugin);
```

### 3.2 Assessment Versioning & Immutability
A recurring failure in educational software occurs when an instructor fixes a typo or changes a point value on a live quiz, mutating in-flight or past student attempts.

To guarantee educational integrity:
1. **Draft State:** Instructors edit `quizzes/{quizId}` which references `questions/{questionId}`.
2. **Publishing Event:** Publishing triggers creation of an immutable snapshot: `quizVersions/{versionId}`.
3. All questions at that instant are deep-copied into the `quizVersion` document or its versioned snapshot subcollection.
4. When a student creates an `attempt`, it is explicitly bound to `quizVersionId`.
5. Future changes to the draft question bank *never* mutate historical attempts.

---

## 4. Assessment Lifecycle & Dual Execution Modes

```
 +-------------------------------------------------------------------------+
 | Mode 1: Practice Mode (Formative)                                       |
 | - Immediate validation per question                                     |
 | - Instant step-by-step walkthrough / explanation                        |
 | - Unlimited retry attempts with optional re-randomization               |
 | - Metacognitive calibration prompt (Confidence: 1-5)                    |
 +-------------------------------------------------------------------------+

 +-------------------------------------------------------------------------+
 | Mode 2: Assessment Mode (Summative / High-Stakes)                       |
 | - Strict deadline enforcement & server-validated timers                 |
 | - Question order & option shuffling                                     |
 | - Continuous client response autosave                                   |
 | - Zero client-side exposure of correct answers or explanations          |
 | - Submission sealed upon completion (idempotent submission flag)        |
 | - Feedback & explanations withheld until instructor release / deadline  |
 +-------------------------------------------------------------------------+
```

---

## 5. Optional AI Service Layer (Gemini Integration)
Per project guidelines, the platform is 100% operational without AI. Any future AI capabilities are abstracted behind `lib/ai/service.ts`:

- **Execution Boundary:** Server-side API routes or Server Actions only. No client-side SDK usage or key exposure.
- **Role:** Formative tutoring and instructor assistance only (generating question drafts, summarizing anonymized misconceptions, proposing alternative scenario parameters). Never authoritative for final grading.
- **Fail-Safe:** If the Gemini API is unreachable, quota-limited, or disabled, the platform gracefully continues standard deterministic operations.
