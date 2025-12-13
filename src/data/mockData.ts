import type {
  SupervisorProgram,
  ProgramAssignment,
  CourseEnrollment,
} from "@/types/models";

export const mockPrograms: SupervisorProgram[] = [
  {
    id: "prog_101",
    supervisorId: "pat_mann_guid",
    programName: "Q3 Safety Ramp-up",
    description: "Mandatory safety training for all floor staff.",
    tags: ["Safety", "Onboarding"],
    courseSequence: [116, 11, 9],
    published: true,
    createdAt: "2025-12-01T10:00:00Z",
  },
  {
    id: "prog_102",
    supervisorId: "pat_mann_guid",
    programName: "Advanced 5-Axis Certification",
    description: "High-level machining certification track.",
    tags: ["Advanced", "Certification", "Skills"],
    courseSequence: [11, 131],
    published: false,
    createdAt: "2025-11-15T10:00:00Z",
  },
  {
    id: "de9dafc0-c1f2-4de2-ab7e-c2da38382f21",
    supervisorId: "pat_mann_guid",
    programName: "Test Program",
    description: "asdf asdf",
    tags: [],
    courseSequence: [116, 11, 9, 131, 90],
    published: false,
    createdAt: "2025-12-11T16:08:46.048Z",
  },
  {
    id: "fdaddc5f-6250-49a2-b59b-56c1c058df1f",
    supervisorId: "pat_mann_guid",
    programName: "My Program",
    description: "",
    tags: [],
    courseSequence: [90, 11, 9, 116, 131],
    published: false,
    createdAt: "2025-12-11T21:37:23.288Z",
  },
];

export const mockAssignments: ProgramAssignment[] = [
  {
    id: "assign_001",
    learnerId: "6c541134-c0f6-41af-904a-1dcb46d16b71",
    programId: "prog_101",
    assignedDate: "2025-12-01T10:00:00Z",
    status: "Pending",
  },
  {
    id: "assign_002",
    learnerId: "6c541134-c0f6-41af-904a-1dcb46d16b71",
    programId: "prog_102",
    assignedDate: "2025-11-20T10:00:00Z",
    status: "Registered",
  },
  {
    id: "aadddfff-b4d7-42da-961c-18fd1359ecb6",
    learnerId: "fc0670d4-3874-48b6-94b2-14b99d326e50",
    programId: "prog_101",
    assignedDate: "2025-12-11T00:35:17.640Z",
    status: "Pending",
  },
];

export const mockEnrollments: CourseEnrollment[] = [
  {
    id: "enroll_999",
    learnerId: "6c541134-c0f6-41af-904a-1dcb46d16b71",
    programId: "prog_101",
    courseId: 116,
    classId: 5451,
    enrolledDate: "2025-12-02T10:00:00Z",
  },
  {
    id: "enroll_888",
    learnerId: "6c541134-c0f6-41af-904a-1dcb46d16b71",
    programId: "prog_102",
    courseId: 11,
    classId: 5447,
    enrolledDate: "2025-11-25T10:00:00Z",
  },
  {
    id: "enroll_777",
    learnerId: "6c541134-c0f6-41af-904a-1dcb46d16b71",
    programId: "prog_102",
    courseId: 131,
    classId: 0,
    enrolledDate: "2025-11-26T10:00:00Z",
  },
];
