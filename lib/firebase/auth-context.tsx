'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './client';
import { UserProfile, UserRole } from '@/lib/validations/user';
import { Repository } from './repository';

export interface DemoUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  institution: string;
}

export const DEMO_PERSONAS: Record<string, DemoUser> = {
  admin: {
    id: 'admin-khaled19',
    email: 'khaled19@admin.os',
    displayName: 'Khaled (Admin)',
    role: 'admin',
    institution: 'Department of Computer Science',
  },
  student: {
    id: 'student-202014019',
    email: '202014019@student.mist.ac.bd',
    displayName: 'Khaled Hasan',
    role: 'student',
    institution: 'MIST CSE',
  },
};

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  role: UserRole;
  isInstructor: boolean;
  isAdmin: boolean;
  isStudent: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  loginAdmin: (id: string, pass: string) => boolean;
  loginStudent: (studentId: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signupStudent: (name: string, studentId: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  switchDemoPersona: (personaKey: keyof typeof DEMO_PERSONAS) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('os_active_profile');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    // Default to student persona for gentle landing
    if (DEMO_PERSONAS.student) {
      return {
        id: DEMO_PERSONAS.student.id,
        email: DEMO_PERSONAS.student.email,
        displayName: DEMO_PERSONAS.student.displayName,
        role: 'student',
        institution: DEMO_PERSONAS.student.institution,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
    return null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const data = userSnap.data() as UserProfile;
            setProfile(data);
          }
        } catch {
          // fallback
        }
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const loginAdmin = (id: string, pass: string): boolean => {
    if (id.trim() === 'khaled19' && pass === 'hellotestingOS@12345') {
      const adminProfile: UserProfile = {
        id: 'admin-khaled19',
        email: 'khaled19@admin.os',
        displayName: 'Khaled (Admin)',
        role: 'admin',
        institution: 'Operating Systems Department',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProfile(adminProfile);
      if (typeof window !== 'undefined') {
        localStorage.setItem('os_active_profile', JSON.stringify(adminProfile));
      }
      return true;
    }
    return false;
  };

  const loginStudent = async (studentId: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const student = await Repository.validateStudentLogin(studentId, pass);
      if (!student) {
        return { success: false, error: 'Invalid Student ID or password. Please check your credentials or create an account.' };
      }
      const studentProfile: UserProfile = {
        id: student.id,
        email: `${student.studentId}@student.os`,
        displayName: student.name,
        role: 'student',
        institution: 'Computer Science & Engineering',
        createdAt: student.registeredAt,
        updatedAt: new Date().toISOString(),
      };
      setProfile(studentProfile);
      if (typeof window !== 'undefined') {
        localStorage.setItem('os_active_profile', JSON.stringify(studentProfile));
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Authentication error. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const signupStudent = async (name: string, studentId: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    try {
      const existing = await Repository.validateStudentLogin(studentId);
      if (existing) {
        return { success: false, error: 'Student ID already registered. Please log in directly.' };
      }
      const newStudent = await Repository.registerStudent({
        id: `stu-${Date.now()}`,
        studentId: studentId.trim(),
        name: name.trim(),
        password: pass,
        registeredAt: new Date().toISOString(),
      });
      const studentProfile: UserProfile = {
        id: newStudent.id,
        email: `${newStudent.studentId}@student.os`,
        displayName: newStudent.name,
        role: 'student',
        institution: 'Computer Science & Engineering',
        createdAt: newStudent.registeredAt,
        updatedAt: new Date().toISOString(),
      };
      setProfile(studentProfile);
      if (typeof window !== 'undefined') {
        localStorage.setItem('os_active_profile', JSON.stringify(studentProfile));
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Registration failed. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const switchDemoPersona = (personaKey: keyof typeof DEMO_PERSONAS) => {
    const persona = DEMO_PERSONAS[personaKey];
    if (persona) {
      const newProfile: UserProfile = {
        id: persona.id,
        email: persona.email,
        displayName: persona.displayName,
        role: persona.role,
        institution: persona.institution,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProfile(newProfile);
      if (typeof window !== 'undefined') {
        localStorage.setItem('os_active_profile', JSON.stringify(newProfile));
      }
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      if (auth.currentUser) {
        await firebaseSignOut(auth);
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem('os_active_profile');
      }
      // Reset to guest student
      setProfile({
        id: 'guest',
        email: '',
        displayName: 'Guest Student',
        role: 'student',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const role: UserRole = profile?.role || 'student';
  const isInstructor = role === 'instructor' || role === 'admin';
  const isAdmin = role === 'admin';
  const isStudent = role === 'student';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        role,
        isInstructor,
        isAdmin,
        isStudent,
        signInWithEmail,
        signInWithGoogle,
        loginAdmin,
        loginStudent,
        signupStudent,
        switchDemoPersona,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
