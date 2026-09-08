# Firestore Data Model & Schema Specification
## Interactive Learning & Assessment Platform

---

## 1. Principles of Data Modeling
1. **Deny Unbounded Growth:** No document contains indefinitely growing arrays (e.g., questions, responses, and submissions are never aggregated inside a single parent array).
2. **Subcollection vs. Root Collection Separation:**
   - Entities requiring broad collection-group querying or global security governance (e.g. `users`, `courses`, `quizzes`, `questionBanks`) live in top-level collections.
   - Fine-grained items scoped strictly to a parent context (e.g. `attempts/{attemptId}/responses/{questionId}`) live in subcollections.
3. **Immutable Quiz Snapshots:** A `quizVersion` stores the frozen snapshot of all question definitions at time of publication.
4. **Data Minimization:** Only operational education metrics (response times, answer states, confidence ratings) are captured; personal identifiers are limited to Auth UID, name, and email.

---

## 2. Collection Hierarchy

```
/users/{userId}
/courses/{courseId}
    /sections/{sectionId}
    /members/{userId}
/questionBanks/{bankId}
    /questions/{questionId}
/quizzes/{quizId}
    /versions/{versionId}
/attempts/{attemptId}
    /responses/{questionId}
/scenarioTemplates/{templateId}
/auditLogs/{logId}
```

---

## 3. Entity Schemas & Type Definitions

### 3.1 `users`
**Collection:** `/users/{userId}`  
Stores public user profile and assigned system role.
```typescript
interface UserDocument {
  id: string; // matches Firebase Auth UID
  email: string;
  displayName: string;
  role: 'student' | 'instructor' | 'admin';
  institution?: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

### 3.2 `courses`
**Collection:** `/courses/{courseId}`  
Stores primary course meta and list of instructor UIDs.
```typescript
interface CourseDocument {
  id: string;
  courseCode: string;       // e.g. "CSE-307"
  courseTitle: string;      // e.g. "Operating System"
  semester: string;         // e.g. "Spring 2026"
  academicYear: string;     // e.g. "2025-2026"
  institution: string;
  description: string;
  instructorIds: string[];  // UIDs of instructors authorized to manage
  enrollmentCode: string;   // 6-char alphanumeric code for student self-join
  isArchived: boolean;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

#### Subcollection: `/courses/{courseId}/sections/{sectionId}`
```typescript
interface SectionDocument {
  id: string;
  name: string;             // e.g. "Section A"
  studentIds: string[];     // UIDs of enrolled students
  createdAt: FirebaseFirestore.Timestamp;
}
```

#### Subcollection: `/courses/{courseId}/members/{userId}`
Fast lookup for student course membership and permissions.
```typescript
interface CourseMemberDocument {
  userId: string;
  courseId: string;
  role: 'student' | 'ta' | 'instructor';
  sectionId?: string;
  enrolledAt: FirebaseFirestore.Timestamp;
  status: 'active' | 'dropped';
}
```

### 3.3 `questionBanks` & `questions`
**Collection:** `/questionBanks/{bankId}`
```typescript
interface QuestionBankDocument {
  id: string;
  courseId: string;
  title: string;            // e.g. "OS Memory Management Bank"
  description: string;
  tags: string[];
  createdBy: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

#### Subcollection: `/questionBanks/{bankId}/questions/{questionId}`
```typescript
type QuestionType = 
  | 'mcq-single' 
  | 'mcq-multi' 
  | 'true-false' 
  | 'numeric' 
  | 'short-text' 
  | 'ordering' 
  | 'matching' 
  | 'scenario' 
  | 'confidence' 
  | 'feedback';

interface BaseQuestion {
  id: string;
  type: QuestionType;
  title: string;
  prompt: string;
  description?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  topic: string;            // e.g. "Paging"
  subtopic?: string;         // e.g. "Address Translation"
  points: number;
  hint?: string;
  explanation: string;      // Pedagogical breakdown revealed upon completion
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}

// Discriminated Unions for Evaluation Configs & Options
interface McqOption {
  id: string;
  text: string;
  isCorrect?: boolean;     // Stripped from client during active assessment
}

interface McqQuestion extends BaseQuestion {
  type: 'mcq-single' | 'mcq-multi';
  options: McqOption[];
  shuffleOptions: boolean;
}

interface NumericQuestion extends BaseQuestion {
  type: 'numeric';
  correctValue: number;
  tolerance: number;        // e.g. 0.01 or 0 for exact integer
  unit?: string;
}

interface ScenarioQuestion extends BaseQuestion {
  type: 'scenario';
  scenarioType: 'paging-translation' | 'disk-scheduling' | string;
  scenarioConfig: Record<string, any>;
}
```

### 3.4 `quizzes` & `quizVersions`
**Collection:** `/quizzes/{quizId}`
```typescript
interface QuizDocument {
  id: string;
  courseId: string;
  title: string;
  description: string;
  instructions: string;
  assignedSectionIds: string[]; // empty array means entire course
  mode: 'assessment' | 'practice';
  
  // Timing & Access
  availableFrom: FirebaseFirestore.Timestamp;
  dueAt: FirebaseFirestore.Timestamp;
  timeLimitMinutes?: number;
  maxAttempts: number;         // 0 for unlimited (practice mode)
  
  // Presentation Controls
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  collectConfidence: boolean;
  allowReviewAfterDue: boolean;
  revealExplanations: boolean;
  revealCorrectAnswers: boolean;
  showScoreImmediately: boolean;
  
  // Publishing State
  isPublished: boolean;
  activeVersionId?: string;
  
  createdBy: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

#### Subcollection: `/quizzes/{quizId}/versions/{versionId}`
```typescript
interface QuizVersionDocument {
  id: string;
  quizId: string;
  versionNumber: number;
  publishedAt: FirebaseFirestore.Timestamp;
  publishedBy: string;
  
  // Frozen Question Definitions Snapshot
  questions: Array<Record<string, any>>;
  totalPoints: number;
}
```

### 3.5 `attempts` & `responses`
**Collection:** `/attempts/{attemptId}`
```typescript
interface AttemptDocument {
  id: string;
  userId: string;
  courseId: string;
  quizId: string;
  quizVersionId: string;
  attemptNumber: number;
  
  startedAt: FirebaseFirestore.Timestamp;
  submittedAt?: FirebaseFirestore.Timestamp;
  expiresAt?: FirebaseFirestore.Timestamp;
  
  status: 'in-progress' | 'submitted' | 'timed-out';
  score?: number;
  maxScore: number;
  percentage?: number;
}
```

#### Subcollection: `/attempts/{attemptId}/responses/{questionId}`
```typescript
interface ResponseDocument {
  questionId: string;
  attemptId: string;
  userId: string;
  
  answer: any;              // Selected option id, numeric value, ordering list, etc.
  isCorrect?: boolean;
  pointsEarned?: number;
  
  responseTimeMs: number;
  confidenceRating?: 1 | 2 | 3 | 4 | 5;
  feedbackText?: string;
  hintUsed: boolean;
  changedAnswerCount: number;
  
  updatedAt: FirebaseFirestore.Timestamp;
}
```

---

## 4. Query Optimization & Indexes

To satisfy Firestore constraints and support fast dashboard loading:

1. **Attempts by Student & Quiz:**
   - Collection: `attempts`
   - Fields: `userId ASC, quizId ASC, startedAt DESC`
2. **Attempts by Course & Status:**
   - Collection: `attempts`
   - Fields: `courseId ASC, status ASC, submittedAt DESC`
3. **Quizzes by Course & Publication:**
   - Collection: `quizzes`
   - Fields: `courseId ASC, isPublished ASC, dueAt ASC`
4. **Responses Collection Group Query for Analytics:**
   - Collection Group: `responses`
   - Fields: `questionId ASC, isCorrect ASC, responseTimeMs ASC`
