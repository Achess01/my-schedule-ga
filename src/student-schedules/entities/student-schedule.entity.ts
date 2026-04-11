import type { GeneratedScheduleItem } from '../../class-schedules/entities/class-schedule.entity';

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

export interface StudentScheduleCreateResponse {
  scheduleId: number;
  studentPensumId: number;
  bestSchedule: StudentScheduleAlternative;
  alternativeSchedules: StudentScheduleAlternative[];
  message: string;
}
