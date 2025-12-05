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
