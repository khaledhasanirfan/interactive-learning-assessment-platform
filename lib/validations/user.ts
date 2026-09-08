import { z } from 'zod';

export const UserRoleEnum = z.enum(['student', 'instructor', 'admin']);
export type UserRole = z.infer<typeof UserRoleEnum>;

export const UserProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  displayName: z.string().min(1),
  role: UserRoleEnum.default('student'),
  institution: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type UserProfile = z.infer<typeof UserProfileSchema>;
