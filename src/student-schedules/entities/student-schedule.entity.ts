import type { GeneratedScheduleItem } from '../../class-schedules/entities/class-schedule.entity';
import type { SlotCatalogOutput } from '../../utils/build-slot-catalog';

export interface StudentScheduleCourseSelection {
  courseCode: number;
  courseName: string;
  sectionIndex: number;
  isMandatory: boolean;
  postrequisitesCount: number;
  items: GeneratedScheduleItem[];
}

export interface StudentScheduleUnscheduledCourse {
  courseCode: number;
  reason: string;
  conflictsWith: number[];
}

export interface StudentScheduleAlternative {
  score: number;
  includedCourses: StudentScheduleCourseSelection[];
  unscheduledCourses: StudentScheduleUnscheduledCourse[];
  metrics: {
    includedCoursesCount: number;
    mandatoryCoursesCount: number;
    postrequisitesTotal: number;
    gapCount: number;
  };
}

export interface StoredStudentScheduleItem {
  studentGeneratedScheduleItemId: number;
  generatedScheduleItemId: string;
  configCourseId: string;
  courseCode: number;
  courseName: string;
  sectionIndex: number;
  sessionType: string;
  dayIndex: number;
  startSlot: number;
  periodCount: number;
  requireClassroom: boolean;
  classroomName: string | null;
  professorName: string;
  isMandatory: boolean;
}

export interface StoredStudentSchedule {
  studentGeneratedScheduleId: number;
  name: string;
  generatedScheduleId: string;
  scheduleConfigId: string;
  studentPensumId: number;
  userId: number;
  isBest: boolean;
  active: boolean;
  periodDurationM: number;
  morningStartTime: Date;
  morningEndTime: Date;
  afternoonStartTime: Date;
  afternoonEndTime: Date;
  createdAt: Date;
  slots: SlotCatalogOutput[];
  items: StoredStudentScheduleItem[];
}

export interface StudentScheduleCreateResponse {
  scheduleId: number;
  studentPensumId: number;
  generatedSchedules: StoredStudentSchedule[];
  bestSchedule: StudentScheduleAlternative;
  alternativeSchedules: StudentScheduleAlternative[];
  message: string;
}
