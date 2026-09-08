'use client';

import React, { useState, useEffect } from 'react';
import { Repository } from '@/lib/firebase/repository';
import { Course, CourseMember } from '@/lib/validations/course';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { 
  BookOpen, 
  Plus, 
  Users, 
  Key, 
  Copy, 
  Check, 
  Layers,
  GraduationCap
} from 'lucide-react';

export default function InstructorCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [members, setMembers] = useState<CourseMember[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // New Course Form
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [semester, setSemester] = useState('Spring 2026');
  const [institution, setInstitution] = useState('Department of Computer Science & Engineering');
  const [description, setDescription] = useState('');

  useEffect(() => {
    async function load() {
      const cList = await Repository.getCourses();
      setCourses(cList);
      if (cList.length > 0) {
        const memList = await Repository.getCourseMembers(cList[0]!.id);
        setMembers(memList);
      }
    }
    load();
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseCode.trim() || !courseTitle.trim()) return;

    const newCourse: Course = {
      id: `course-${courseCode.toLowerCase().replace(/[^a-z0-9]/g, '')}-${Date.now()}`,
      courseCode: courseCode.trim().toUpperCase(),
      courseTitle: courseTitle.trim(),
      semester,
      academicYear: '2025-2026',
      institution,
      description,
      instructorIds: ['demo-instructor-turing'],
      enrollmentCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      sections: [
        { id: 'sec-a', name: 'Section A', studentIds: [] },
        { id: 'sec-b', name: 'Section B', studentIds: [] },
      ],
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await Repository.createCourse(newCourse);
    setCourses(prev => [newCourse, ...prev]);
    setIsCreateModalOpen(false);
    setCourseCode('');
    setCourseTitle('');
    setDescription('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            Academic Administration
          </span>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Courses &amp; Roster Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage course sections, enrollment passcodes, and student rosters.
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="gap-1.5 text-xs">
          <Plus className="h-4 w-4" /> Create New Course
        </Button>
      </div>

      {/* Courses List */}
      <div className="space-y-6">
        {courses.map((course) => (
          <Card key={course.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="info" className="text-sm font-bold">{course.courseCode}</Badge>
                  <span className="text-xs text-slate-500 font-medium">{course.semester}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">Enrollment Passcode:</span>
                  <div className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 font-mono font-bold text-xs text-blue-700">
                    {course.enrollmentCode}
                    <button
                      onClick={() => handleCopyCode(course.enrollmentCode)}
                      className="text-slate-400 hover:text-slate-700 cursor-pointer ml-1"
                      title="Copy code"
                    >
                      {copiedCode === course.enrollmentCode ? (
                        <Check className="h-3 w-3 text-emerald-600" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <CardTitle className="mt-2 text-xl">{course.courseTitle}</CardTitle>
              <CardDescription>{course.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Sections summary */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Assigned Sections
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {course.sections.map((sec) => (
                    <div key={sec.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{sec.name}</span>
                      <span className="text-slate-400 font-mono">{sec.studentIds.length} students</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Enrolled Students Roster */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-blue-600" />
                  Enrolled Students Roster ({members.length})
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-[10px] uppercase">
                      <tr>
                        <th className="p-3 pl-4">Student Name</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Section</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 pr-4 text-right">Enrolled Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-normal">
                      {members.map((m) => (
                        <tr key={m.userId} className="hover:bg-slate-50/60">
                          <td className="p-3 pl-4 font-semibold text-slate-900">{m.userName}</td>
                          <td className="p-3 font-mono text-slate-600">{m.userEmail}</td>
                          <td className="p-3">
                            <Badge variant="default">{m.sectionId === 'sec-a' ? 'Section A' : 'Section B'}</Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant="success">Active</Badge>
                          </td>
                          <td className="p-3 pr-4 text-right text-slate-400 font-mono text-[11px]">
                            {new Date(m.enrolledAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Course Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create a New Course"
        description="Configure metadata and initial sections for the new course."
      >
        <form onSubmit={handleCreateCourse} className="space-y-4 text-xs">
          <Input
            label="Course Code"
            placeholder="e.g. CSE-401"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
            required
            autoFocus
          />

          <Input
            label="Course Title"
            placeholder="e.g. Computer Networks"
            value={courseTitle}
            onChange={(e) => setCourseTitle(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Semester"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              required
            />
            <Input
              label="Institution"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              required
            />
          </div>

          <Input
            label="Description"
            placeholder="Brief overview of course topics..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Create Course
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
