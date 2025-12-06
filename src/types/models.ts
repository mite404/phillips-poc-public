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
  courseId: number;
  courseTitle: string;
  levelName: string; // "Basic" | "Advanced"
  trainingTypeName: string; // "ILT" | "eLearning"
  totalDays: number;
  hours: number | null;
  previewImageUrl: string | null;
  prices: { isFree: boolean; price?: number; currency?: string }[];
  skills?: { skillName: string }[];
}

export interface SupervisorProgram {
  id: string; // UUID
  title: string;
  description: string;
  isPublished: boolean;
  courses: {
    sequenceOrder: number;
    courseId: number;
    cachedTitle?: string;
  }[];
}
