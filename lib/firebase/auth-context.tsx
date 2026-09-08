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

export interface DemoUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  institution: string;
}

export const DEMO_PERSONAS: Record<string, DemoUser> = {
  instructor: {
    id: 'demo-instructor-turing',
    email: 'turing@university.edu',
    displayName: 'Prof. Alan Turing',
    role: 'instructor',
    institution: 'Department of Computer Science',
  },
  student1: {
    id: 'demo-student-ada',
    email: 'ada.lovelace@student.edu',
    displayName: 'Ada Lovelace',
    role: 'student',
    institution: 'Department of Computer Science',
  },
  student2: {
    id: 'demo-student-linus',
    email: 'linus.torvalds@student.edu',
    displayName: 'Linus Torvalds',
    role: 'student',
    institution: 'Department of Computer Science',
  },
  admin: {
    id: 'demo-admin-ritchie',
    email: 'admin@university.edu',
    displayName: 'Dennis Ritchie (Admin)',
    role: 'admin',
    institution: 'System Administration',
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
  switchDemoPersona: (personaKey: keyof typeof DEMO_PERSONAS) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('demo_profile');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    // Default to instructor persona for development overview
    return {
      id: DEMO_PERSONAS.instructor.id,
      email: DEMO_PERSONAS.instructor.email,
      displayName: DEMO_PERSONAS.instructor.displayName,
      role: 'instructor',
      institution: DEMO_PERSONAS.instructor.institution,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
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
          } else {
            // Create student profile by default
            const newProfile: UserProfile = {
              id: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Student',
              role: 'student',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
          }
        } catch {
          // If Firestore is offline or local emulator not started, retain active profile
        }
      } else {
        // If not authenticated via Firebase, check if demo mode is enabled
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

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
        localStorage.setItem('demo_profile', JSON.stringify(newProfile));
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
      await firebaseSignOut(auth);
      // Reset to student demo persona on sign out
      switchDemoPersona('student1');
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
