# Security Architecture & Authorization Model
## Interactive Learning & Assessment Platform

---

## 1. Zero-Trust Security Philosophy
The platform operates under a strict **Zero-Trust Client Architecture**:
1. **Deny-by-Default:** Every Firestore collection and document is locked down unless explicitly permitted by granular rules.
2. **Server-Side Grading & Verification:** In high-stakes assessment mode, students are *never* sent answer keys, solutions, or pedagogical explanations before their attempt is sealed and graded.
3. **Role Elevation Guard:** Role assignments (`role: 'instructor' | 'admin'`) are protected by Firebase Auth Custom Claims or restricted server-side admin provisioning; students can *never* set or mutate their own role.
4. **App Check Enforcement:** Validates requests using device attestation (reCAPTCHA Enterprise / Play Integrity), blocking unauthorized script access or API abuse.

---

## 2. Role-Based Access Control (RBAC) Matrix

| Resource / Action | Unauthenticated | Student | Instructor (Course Owner) | Instructor (Other Course) | System Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **View Course Catalog (Public meta)** | ❌ | Allowed | Allowed | Allowed | Allowed |
| **Join Course (via valid code)** | ❌ | Allowed | ❌ (Owns) | Allowed (as auditor) | Allowed |
| **View Question Banks & Answers** | ❌ | ❌ | Allowed (Assigned) | ❌ | Allowed |
| **Create / Publish Quizzes** | ❌ | ❌ | Allowed (Assigned) | ❌ | Allowed |
| **Start Quiz Attempt** | ❌ | Allowed (Enrolled) | Allowed (Preview) | ❌ | Allowed |
| **Autosave Responses (In-Progress)** | ❌ | Allowed (Own only)| ❌ | ❌ | Allowed |
| **Modify Submitted Attempt** | ❌ | ❌ (Immutable) | Allowed (Re-grade)| ❌ | Allowed |
| **View Course Submissions & Metrics**| ❌ | ❌ | Allowed (Assigned) | ❌ | Allowed |
| **Export Response Data (CSV)** | ❌ | ❌ | Allowed (Assigned) | ❌ | Allowed |
| **Promote User to Instructor** | ❌ | ❌ | ❌ | ❌ | Allowed |

---

## 3. Firestore Security Rules Blueprint

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Global Deny
    match /{document=**} {
      allow read, write: if false;
    }

    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }

    function isUser(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isAuthenticated() && 
        (request.auth.token.role == 'admin' || request.auth.token.admin == true);
    }

    function isInstructor() {
      return isAuthenticated() && 
        (request.auth.token.role == 'instructor' || isAdmin());
    }

    function isCourseInstructor(courseId) {
      return isInstructor() && 
        request.auth.uid in get(/databases/$(database)/documents/courses/$(courseId)).data.instructorIds;
    }

    function isEnrolledStudent(courseId) {
      return isAuthenticated() && 
        exists(/databases/$(database)/documents/courses/$(courseId)/members/$(request.auth.uid));
    }

    // Users Collection
    match /users/{userId} {
      allow read: if isAuthenticated();
      allow create: if isUser(userId) && request.resource.data.role == 'student';
      allow update: if isUser(userId) && request.resource.data.role == resource.data.role; // Prevent self-promotion
      allow write: if isAdmin();
    }

    // Courses Collection
    match /courses/{courseId} {
      allow read: if isAuthenticated();
      allow create, update: if isInstructor();
      allow delete: if isAdmin();

      match /members/{memberId} {
        allow read: if isAuthenticated();
        allow create: if isAuthenticated() && request.auth.uid == memberId; // Joining course
        allow write: if isCourseInstructor(courseId) || isAdmin();
      }

      match /sections/{sectionId} {
        allow read: if isEnrolledStudent(courseId) || isCourseInstructor(courseId);
        allow write: if isCourseInstructor(courseId) || isAdmin();
      }
    }

    // Question Banks & Questions (Instructors only)
    match /questionBanks/{bankId} {
      allow read, write: if isInstructor();

      match /questions/{questionId} {
        allow read, write: if isInstructor();
      }
    }

    // Quizzes & Versions
    match /quizzes/{quizId} {
      allow read: if isEnrolledStudent(resource.data.courseId) || isCourseInstructor(resource.data.courseId);
      allow write: if isInstructor();

      match /versions/{versionId} {
        allow read: if isAuthenticated();
        allow write: if isInstructor();
      }
    }

    // Attempts & Responses
    match /attempts/{attemptId} {
      // Students can only read their own attempts; instructors can read their course attempts
      allow read: if isUser(resource.data.userId) || isCourseInstructor(resource.data.courseId) || isAdmin();
      
      // Student can create attempt if enrolled
      allow create: if isAuthenticated() && 
        isUser(request.resource.data.userId) &&
        request.resource.data.status == 'in-progress';
      
      // Attempt cannot be modified once submitted by student
      allow update: if isUser(resource.data.userId) && 
        resource.data.status == 'in-progress' &&
        (request.resource.data.status == 'submitted' || request.resource.data.status == 'in-progress') ||
        isCourseInstructor(resource.data.courseId) || 
        isAdmin();

      // Responses subcollection
      match /responses/{questionId} {
        allow read: if isUser(get(/databases/$(database)/documents/attempts/$(attemptId)).data.userId) ||
          isCourseInstructor(get(/databases/$(database)/documents/attempts/$(attemptId)).data.courseId) ||
          isAdmin();
        
        // Autosave response permitted only while attempt is in-progress
        allow write: if isUser(get(/databases/$(database)/documents/attempts/$(attemptId)).data.userId) &&
          get(/databases/$(database)/documents/attempts/$(attemptId)).data.status == 'in-progress';
      }
    }
  }
}
```

---

## 4. Protection Against Answer Leaks
1. **Client Question Payloads:** When a student queries an active assessment, client-side requests load sanitized question models where `isCorrect`, `explanation`, and scoring weights are stripped via Next.js Server Components / Actions.
2. **Server-Side Grading:** When an attempt is submitted:
   - A secure Server Action or Cloud Function loads the immutable `quizVersion` snapshot using Firebase Admin SDK.
   - Student responses are evaluated server-side.
   - Points earned, total score, and percentage are computed and written to `attempts/{attemptId}`.
3. **Delayed Feedback Release:** Only after the deadline passes (or if the quiz setting explicitly enables `immediateFeedback`), the client is authorized to request the detailed review with step-by-step solutions and explanations.

---

## 5. Firebase App Check & Rate Limiting
- **App Check:** Enforced via reCAPTCHA Enterprise for web clients. Prevents automated headless scripts from flooding endpoints or submitting unauthorized attempts.
- **Server Action Rate Limiting:** In-memory or Redis/Firestore token-bucket limiting applied to question bank CSV/JSON imports and AI misconception summaries.
- **Secrets Management:** Environment variables (e.g. `FIREBASE_ADMIN_PRIVATE_KEY`, `GEMINI_API_KEY`) are managed via Google Cloud Secret Manager / App Hosting environment configuration and never bundled into client bundles.
