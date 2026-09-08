import { z } from 'zod';

export const SectionSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Section name is required'), // e.g. "Section A"
  studentIds: z.array(z.string()).default([]),
});
export type Section = z.infer<typeof SectionSchema>;

export const CourseMemberRoleEnum = z.enum(['student', 'ta', 'instructor']);
export type CourseMemberRole = z.infer<typeof CourseMemberRoleEnum>;

export const CourseMemberSchema = z.object({
  userId: z.string(),
  userEmail: z.string().email(),
  userName: z.string(),
  courseId: z.string(),
  role: CourseMemberRoleEnum.default('student'),
  sectionId: z.string().optional(),
  enrolledAt: z.string(),
  status: z.enum(['active', 'dropped']).default('active'),
});
export type CourseMember = z.infer<typeof CourseMemberSchema>;

export const CourseSchema = z.object({
  id: z.string(),
  courseCode: z.string().min(1, 'Course code is required'), // e.g. "CSE-307"
  courseTitle: z.string().min(1, 'Course title is required'), // e.g. "Operating System"
  semester: z.string().min(1, 'Semester is required'), // e.g. "Spring 2026"
  academicYear: z.string().default('2025-2026'),
  institution: z.string().default('University'),
  description: z.string().default(''),
  instructorIds: z.array(z.string()).min(1, 'At least one instructor is required'),
  enrollmentCode: z.string().min(4, 'Enrollment code must be at least 4 characters'),
  sections: z.array(SectionSchema).default([]),
  isArchived: z.boolean().default(false),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});
export type Course = z.infer<typeof CourseSchema>;

export const CreateCourseSchema = CourseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  enrollmentCode: z.string().optional(),
});
export type CreateCourseInput = z.infer<typeof CreateCourseSchema>;
