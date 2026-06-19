export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type TimePreference = 'Morning' | 'Afternoon' | 'Evening' | 'Flexible';

export interface Subject {
  id: string;
  name: string;
  creditHours: number;
  difficulty: Difficulty;
  timePreference: TimePreference;
  color: string;
}

export interface TimetableEvent {
  id: string;
  subjectId: string;
  subject: string;
  day: number;
  startTime: string;
  endTime: string;
  color: string;
}

export interface UserProfile {
  name: string;
  college: string;
  semester: string;
}

export interface AppState {
  step: number;
  profile: UserProfile | null;
  subjects: Subject[];
  timetable: TimetableEvent[];
  generatedAt: string | null;
}

export const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
export const SHORT_DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
export const SUBJECT_COLORS = [
  '#6366f1','#ec4899','#10b981','#f59e0b','#3b82f6',
  '#ef4444','#14b8a6','#a855f7','#f97316','#06b6d4','#84cc16','#8b5cf6'
];
