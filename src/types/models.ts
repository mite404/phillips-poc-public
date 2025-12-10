export interface LegacyProgram {
  programId: number;
  programName: string;
  levelName: string;
  totalDays: number;
  active: boolean;
  previewImageUrl: string | null;
  courses: any[]; // Or specific Course interface if detailed info needed
  skills: { skillName: string }[];
  prices: { isFree: boolean; price: number; currency: string }[];
}

export interface CourseCatalogItem {
  // CORE IDENTIFIERS
  courseId: number; // Needed for linking
  courseTitle: string; // Needed for Search & Display

  // UI METADATA (Needed for the Card visuals & Filtering)
  levelName: string; // "Basic", "Advanced"
  trainingTypeName: string; // "ILT", "eLearning"
  totalDays: number; // For duration calc
  hours: number | null; // For duration calc
  previewImageUrl: string | null; // The thumbnail

  // EXTRA DETAILS (Optional but good for "View Details" modal)
  prices: { isFree: boolean; price?: number; currency?: string }[];
  skills?: { skillName: string }[];
}

export interface SupervisorProgram {
  id: string; // UUID
  supervisorId: string; // UUID (e.g. "pat_mann_guid")
  programName: string;
  description: string;
  tags: string[];

  // The Sequence is just the IDs. Order in array = Sequence order.
  courseSequence: number[];

  published: boolean;
  createdAt: string;
}

export interface ProgramRegistration {
  id: string; // UUID
  studentId: string; // GUID (Matches Learner API)
  programId: string; // UUID (Matches SupervisorProgram)
  assignedDate: string;
  status: "Pending" | "Enrolled" | "Completed";
}
