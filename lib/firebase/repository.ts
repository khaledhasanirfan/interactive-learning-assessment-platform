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

// Local in-memory store for fallback/demo execution
const mockStore = {
  courses: [SEED_COURSE] as Course[],
  members: [
    {
      userId: 'demo-student-ada',
      userEmail: 'ada.lovelace@student.edu',
      userName: 'Ada Lovelace',
      courseId: SEED_COURSE.id,
      role: 'student' as const,
      sectionId: 'sec-a',
      enrolledAt: new Date().toISOString(),
      status: 'active' as const,
    },
    {
      userId: 'demo-student-linus',
      userEmail: 'linus.torvalds@student.edu',
      userName: 'Linus Torvalds',
      courseId: SEED_COURSE.id,
      role: 'student' as const,
      sectionId: 'sec-b',
      enrolledAt: new Date().toISOString(),
      status: 'active' as const,
    },
  ] as CourseMember[],
  quizzes: [SEED_QUIZ_ASSESSMENT, SEED_QUIZ_PRACTICE] as Quiz[],
  quizVersions: [SEED_QUIZ_VERSION_ASSESSMENT, SEED_QUIZ_VERSION_PRACTICE] as QuizVersion[],
  attempts: [...SEED_ATTEMPTS] as Attempt[],
  responses: { ...SEED_RESPONSES } as Record<string, StudentResponse[]>,
  banks: [
    {
      id: 'bank-master-os',
      courseId: SEED_COURSE.id,
      title: 'CSE-307 Master OS Bank',
      description: 'Standard question bank with virtual memory and disk scheduling questions',
      tags: ['os', 'memory', 'disk'],
      questions: SEED_QUESTIONS,
      createdBy: 'demo-instructor-turing',
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
    return mockStore.quizzes.find(qz => qz.id === quizId) || null;
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
    return mockStore.quizVersions.find(qv => qv.id === versionId) || null;
  },

  async publishQuizVersion(quizId: string, version: QuizVersion): Promise<QuizVersion> {
    try {
      await setDoc(doc(db, 'quizzes', quizId, 'versions', version.id), version);
    } catch {
      // Ignore
    }
    mockStore.quizVersions.push(version);
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
    return mockStore.attempts.filter(a => a.quizId === quizId);
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
    return mockStore.attempts.filter(a => a.userId === userId);
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
};
