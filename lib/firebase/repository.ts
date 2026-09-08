import { db } from './client';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  query, 
  where,
} from 'firebase/firestore';
import { Course, CourseMember } from '@/lib/validations/course';
import { Quiz, QuizVersion } from '@/lib/validations/quiz';
import { Attempt, StudentResponse } from '@/lib/validations/attempt';
import { Question, QuestionBank } from '@/lib/validations/question';
import { 
  SEED_COURSE, 
  SEED_QUESTIONS, 
  SEED_QUIZ_ASSESSMENT, 
  SEED_QUIZ_VERSION_ASSESSMENT,
  SEED_QUIZ_PRACTICE, 
  SEED_QUIZ_VERSION_PRACTICE, 
  SEED_ATTEMPTS, 
  SEED_RESPONSES 
} from '@/lib/seed/seed-data';

export interface RegisteredStudent {
  id: string;
  studentId: string;
  name: string;
  password?: string;
  registeredAt: string;
}

export interface UserFeedback {
  id: string;
  studentId: string;
  studentName: string;
  category: 'issue' | 'feedback' | 'complaint' | 'feature_request';
  message: string;
  submittedAt: string;
  status: 'new' | 'reviewed' | 'resolved';
}

// Single active Live Class Task for Operating Systems
const LIVE_CLASS_TASK_QUIZ: Quiz = {
  id: 'live-class-task-os',
  courseId: SEED_COURSE.id,
  title: 'CSE-307 Live Class Task: Operating Systems Core Assessment',
  description: 'Official live class assessment featuring Virtual Memory Paging, CPU Scheduling, and Kernel Synchronization.',
  instructions: 'Answer all questions carefully. Text answers will be evaluated based on technical correctness and understanding.',
  assignedSectionIds: [],
  mode: 'assessment',
  availableFrom: new Date(Date.now() - 3600 * 1000).toISOString(),
  dueAt: new Date(Date.now() + 3600 * 1000 * 48).toISOString(),
  timeLimitMinutes: 25,
  maxAttempts: 2,
  shuffleQuestions: false,
  shuffleOptions: true,
  immediateFeedback: true,
  revealCorrectAnswer: true,
  revealExplanation: true,
  showScoreImmediately: true,
  collectConfidence: true,
  isPublished: true,
  activeVersionId: 'ver-live-class-task-v1',
  questionIds: ['q-bank-01', 'q-bank-02', 'q-bank-05', 'q-bank-06', 'q-bank-11'],
  createdBy: 'khaled19',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const LIVE_CLASS_TASK_VERSION: QuizVersion = {
  id: 'ver-live-class-task-v1',
  quizId: 'live-class-task-os',
  versionNumber: 1,
  publishedAt: new Date().toISOString(),
  publishedBy: 'khaled19',
  questions: SEED_QUESTIONS.filter(q => LIVE_CLASS_TASK_QUIZ.questionIds.includes(q.id)),
  totalPoints: 15,
  mode: 'assessment',
  timeLimitMinutes: 25,
  collectConfidence: true,
  immediateFeedback: true,
  revealCorrectAnswer: true,
  revealExplanation: true,
  showScoreImmediately: true,
};

// Local in-memory store for fallback/manual testing execution
const mockStore = {
  students: [] as RegisteredStudent[],
  feedbacks: [] as UserFeedback[],
  courses: [SEED_COURSE] as Course[],
  members: [] as CourseMember[],
  quizzes: [LIVE_CLASS_TASK_QUIZ] as Quiz[],
  quizVersions: [LIVE_CLASS_TASK_VERSION] as QuizVersion[],
  attempts: [] as Attempt[],
  responses: {} as Record<string, StudentResponse[]>,
  banks: [
    {
      id: 'bank-master-os',
      courseId: SEED_COURSE.id,
      title: 'CSE-307 Master OS Bank',
      description: 'Standard question bank with virtual memory and disk scheduling questions',
      tags: ['os', 'memory', 'disk'],
      questions: SEED_QUESTIONS,
      createdBy: 'khaled19',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  ] as QuestionBank[],
};

export const Repository = {
  // COURSES
  async getCourses(): Promise<Course[]> {
    try {
      const snap = await getDocs(collection(db, 'courses'));
      if (!snap.empty) {
        return snap.docs.map(d => d.data() as Course);
      }
    } catch {
      // Fallback
    }
    return [...mockStore.courses];
  },

  async getCourseById(courseId: string): Promise<Course | null> {
    try {
      const snap = await getDoc(doc(db, 'courses', courseId));
      if (snap.exists()) {
        return snap.data() as Course;
      }
    } catch {
      // Fallback
    }
    return mockStore.courses.find(c => c.id === courseId) || null;
  },

  async createCourse(course: Course): Promise<Course> {
    try {
      await setDoc(doc(db, 'courses', course.id), course);
    } catch {
      // Ignore
    }
    mockStore.courses.push(course);
    return course;
  },

  async joinCourse(courseId: string, member: CourseMember): Promise<boolean> {
    try {
      await setDoc(doc(db, 'courses', courseId, 'members', member.userId), member);
    } catch {
      // Ignore
    }
    mockStore.members.push(member);
    return true;
  },

  async getCourseMembers(courseId: string): Promise<CourseMember[]> {
    try {
      const snap = await getDocs(collection(db, 'courses', courseId, 'members'));
      if (!snap.empty) {
        return snap.docs.map(d => d.data() as CourseMember);
      }
    } catch {
      // Ignore
    }
    return mockStore.members.filter(m => m.courseId === courseId);
  },

  // QUESTION BANKS
  async getQuestionBanks(): Promise<QuestionBank[]> {
    try {
      const snap = await getDocs(collection(db, 'questionBanks'));
      if (!snap.empty) {
        return snap.docs.map(d => d.data() as QuestionBank);
      }
    } catch {
      // Ignore
    }
    return [...mockStore.banks];
  },

  async saveQuestionBank(bank: QuestionBank): Promise<QuestionBank> {
    try {
      await setDoc(doc(db, 'questionBanks', bank.id), bank);
    } catch {
      // Ignore
    }
    const idx = mockStore.banks.findIndex(b => b.id === bank.id);
    if (idx >= 0) {
      mockStore.banks[idx] = bank;
    } else {
      mockStore.banks.push(bank);
    }
    return bank;
  },

  // QUIZZES
  async getQuizzes(courseId?: string): Promise<Quiz[]> {
    try {
      const ref = collection(db, 'quizzes');
      const q = courseId ? query(ref, where('courseId', '==', courseId)) : ref;
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs.map(d => d.data() as Quiz);
      }
    } catch {
      // Ignore
    }
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('os_custom_quizzes');
      if (local) {
        try {
          const list: Quiz[] = JSON.parse(local);
          list.forEach(q => {
            if (!mockStore.quizzes.some(mq => mq.id === q.id)) {
              mockStore.quizzes.push(q);
            }
          });
        } catch {
          // ignore
        }
      }
    }
    return courseId ? mockStore.quizzes.filter(qz => qz.courseId === courseId) : [...mockStore.quizzes];
  },

  async getQuizById(quizId: string): Promise<Quiz | null> {
    try {
      const snap = await getDoc(doc(db, 'quizzes', quizId));
      if (snap.exists()) {
        return snap.data() as Quiz;
      }
    } catch {
      // Ignore
    }
    const list = await this.getQuizzes();
    return list.find(qz => qz.id === quizId) || null;
  },

  async saveQuiz(quiz: Quiz): Promise<Quiz> {
    try {
      await setDoc(doc(db, 'quizzes', quiz.id), quiz);
    } catch {
      // Ignore
    }
    const idx = mockStore.quizzes.findIndex(q => q.id === quiz.id);
    if (idx >= 0) {
      mockStore.quizzes[idx] = quiz;
    } else {
      mockStore.quizzes.push(quiz);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('os_custom_quizzes', JSON.stringify(mockStore.quizzes));
    }
    return quiz;
  },

  // QUIZ VERSIONS
  async getQuizVersion(quizId: string, versionId: string): Promise<QuizVersion | null> {
    try {
      const snap = await getDoc(doc(db, 'quizzes', quizId, 'versions', versionId));
      if (snap.exists()) {
        return snap.data() as QuizVersion;
      }
    } catch {
      // Ignore
    }
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('os_custom_versions');
      if (local) {
        try {
          const list: QuizVersion[] = JSON.parse(local);
          const found = list.find(qv => qv.id === versionId);
          if (found) return found;
        } catch {
          // ignore
        }
      }
    }
    return mockStore.quizVersions.find(qv => qv.id === versionId) || null;
  },

  async publishQuizVersion(quizId: string, version: QuizVersion): Promise<QuizVersion> {
    try {
      await setDoc(doc(db, 'quizzes', quizId, 'versions', version.id), version);
    } catch {
      // Ignore
    }
    mockStore.quizVersions.push(version);
    if (typeof window !== 'undefined') {
      localStorage.setItem('os_custom_versions', JSON.stringify(mockStore.quizVersions));
    }
    return version;
  },

  // ATTEMPTS & RESPONSES
  async getAttemptsByQuiz(quizId: string): Promise<Attempt[]> {
    try {
      const snap = await getDocs(query(collection(db, 'attempts'), where('quizId', '==', quizId)));
      if (!snap.empty) {
        return snap.docs.map(d => d.data() as Attempt);
      }
    } catch {
      // Ignore
    }
    const all = await this.getAllAttempts();
    return all.filter(a => a.quizId === quizId);
  },

  async getAttemptsByUser(userId: string): Promise<Attempt[]> {
    try {
      const snap = await getDocs(query(collection(db, 'attempts'), where('userId', '==', userId)));
      if (!snap.empty) {
        return snap.docs.map(d => d.data() as Attempt);
      }
    } catch {
      // Ignore
    }
    const all = await this.getAllAttempts();
    return all.filter(a => a.userId === userId || a.userId === `demo-student-${userId.toLowerCase()}` || a.userEmail?.includes(userId));
  },

  async getAttemptById(attemptId: string): Promise<Attempt | null> {
    try {
      const snap = await getDoc(doc(db, 'attempts', attemptId));
      if (snap.exists()) {
        return snap.data() as Attempt;
      }
    } catch {
      // Ignore
    }
    return mockStore.attempts.find(a => a.id === attemptId) || null;
  },

  async saveAttempt(attempt: Attempt): Promise<Attempt> {
    try {
      await setDoc(doc(db, 'attempts', attempt.id), attempt);
    } catch {
      // Ignore
    }
    const idx = mockStore.attempts.findIndex(a => a.id === attempt.id);
    if (idx >= 0) {
      mockStore.attempts[idx] = attempt;
    } else {
      mockStore.attempts.push(attempt);
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem('os_student_attempts', JSON.stringify(mockStore.attempts));
    }
    return attempt;
  },

  async saveResponse(attemptId: string, response: StudentResponse): Promise<StudentResponse> {
    try {
      await setDoc(doc(db, 'attempts', attemptId, 'responses', response.questionId), response);
    } catch {
      // Ignore
    }
    if (!mockStore.responses[attemptId]) {
      mockStore.responses[attemptId] = [];
    }
    const list = mockStore.responses[attemptId];
    const idx = list.findIndex(r => r.questionId === response.questionId);
    if (idx >= 0) {
      list[idx] = response;
    } else {
      list.push(response);
    }
    return response;
  },

  async getResponses(attemptId: string): Promise<StudentResponse[]> {
    try {
      const snap = await getDocs(collection(db, 'attempts', attemptId, 'responses'));
      if (!snap.empty) {
        return snap.docs.map(d => d.data() as StudentResponse);
      }
    } catch {
      // Ignore
    }
    return mockStore.responses[attemptId] || [];
  },

  async getResponsesByAttempt(attemptId: string): Promise<StudentResponse[]> {
    return this.getResponses(attemptId);
  },

  // STUDENTS & AUTH
  async getRegisteredStudents(): Promise<RegisteredStudent[]> {
    try {
      const snap = await getDocs(collection(db, 'students'));
      if (!snap.empty) {
        return snap.docs.map(d => d.data() as RegisteredStudent);
      }
    } catch {
      // Ignore
    }
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('os_registered_students');
      if (local) {
        try {
          const list: RegisteredStudent[] = JSON.parse(local);
          const filtered = list.filter(s => 
            s.name !== 'Ada Lovelace' && 
            s.name !== 'Linus Torvalds' && 
            s.studentId !== 'STU-2026-001' && 
            s.studentId !== 'STU-2026-002'
          );
          return filtered;
        } catch {
          // fallback
        }
      }
    }
    return [...mockStore.students];
  },

  async registerStudent(student: RegisteredStudent): Promise<RegisteredStudent> {
    try {
      await setDoc(doc(db, 'students', student.studentId), student);
    } catch {
      // Ignore
    }
    const idx = mockStore.students.findIndex(s => s.studentId === student.studentId);
    if (idx >= 0) {
      mockStore.students[idx] = student;
    } else {
      mockStore.students.push(student);
    }
    if (typeof window !== 'undefined') {
      const filtered = mockStore.students.filter(s => 
        s.name !== 'Ada Lovelace' && 
        s.name !== 'Linus Torvalds' && 
        s.studentId !== 'STU-2026-001' && 
        s.studentId !== 'STU-2026-002'
      );
      localStorage.setItem('os_registered_students', JSON.stringify(filtered));
    }
    return student;
  },

  async validateStudentLogin(studentId: string, password?: string): Promise<RegisteredStudent | null> {
    const list = await this.getRegisteredStudents();
    const found = list.find(s => s.studentId.trim().toLowerCase() === studentId.trim().toLowerCase());
    if (!found) return null;
    if (password && found.password && found.password !== password) {
      return null;
    }
    return found;
  },

  // FEEDBACKS & COMPLAINTS
  async submitFeedback(feedback: UserFeedback): Promise<UserFeedback> {
    try {
      await setDoc(doc(db, 'feedbacks', feedback.id), feedback);
    } catch {
      // Ignore
    }
    mockStore.feedbacks.unshift(feedback);
    if (typeof window !== 'undefined') {
      localStorage.setItem('os_feedbacks', JSON.stringify(mockStore.feedbacks));
    }
    return feedback;
  },

  async getFeedbacks(): Promise<UserFeedback[]> {
    try {
      const snap = await getDocs(collection(db, 'feedbacks'));
      if (!snap.empty) {
        return snap.docs.map(d => d.data() as UserFeedback);
      }
    } catch {
      // Ignore
    }
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('os_feedbacks');
      if (local) {
        try {
          const list: UserFeedback[] = JSON.parse(local);
          const filtered = list.filter(f => 
            f.studentName !== 'Ada Lovelace' && 
            f.studentName !== 'Linus Torvalds' && 
            f.id !== 'fb-001' && 
            f.id !== 'fb-002'
          );
          return filtered;
        } catch {
          // fallback
        }
      }
    }
    return [...mockStore.feedbacks];
  },

  // QUIZ & QUESTION CREATION FOR ADMIN
  async createAndPublishQuiz(quiz: Quiz, version: QuizVersion): Promise<{ quiz: Quiz; version: QuizVersion }> {
    await this.saveQuiz(quiz);
    await this.publishQuizVersion(quiz.id, version);
    if (typeof window !== 'undefined') {
      localStorage.setItem('os_custom_quizzes', JSON.stringify(mockStore.quizzes));
      localStorage.setItem('os_custom_versions', JSON.stringify(mockStore.quizVersions));
    }
    return { quiz, version };
  },

  async getAllAttempts(): Promise<Attempt[]> {
    try {
      const snap = await getDocs(collection(db, 'attempts'));
      if (!snap.empty) {
        return snap.docs
          .map(d => d.data() as Attempt)
          .filter(a => a.userId !== 'STU-2026-001' && a.userId !== 'STU-2026-002' && a.userId !== 'user-student-01' && a.userId !== 'user-student-02');
      }
    } catch {
      // Ignore
    }
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem('os_student_attempts');
      if (local) {
        try {
          const list: Attempt[] = JSON.parse(local);
          return list.filter(a => a.userId !== 'STU-2026-001' && a.userId !== 'STU-2026-002' && a.userId !== 'user-student-01' && a.userId !== 'user-student-02');
        } catch {
          // ignore
        }
      }
    }
    return [...mockStore.attempts];
  },

  async getStudentAttempts(studentId: string): Promise<Attempt[]> {
    const all = await this.getAllAttempts();
    return all.filter(a => a.userId === studentId || a.userId === `demo-student-${studentId.toLowerCase()}`);
  }
};
