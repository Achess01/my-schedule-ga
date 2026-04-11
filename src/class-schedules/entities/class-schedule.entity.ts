export interface GeneratedScheduleSummary {
  generatedScheduleId: string;
  scheduleConfigId: string;
  periodDurationM: number;
  morningStartTime: string;
  morningEndTime: string;
  afternoonStartTime: string;
  afternoonEndTime: string;
  name: string;
  status: string;
  fitness: number;
  hardPenalty: number;
  softPenalty: number;
  feasibilityPenalty: number;
  requiredGeneCount: number;
  assignedGeneCount: number;
  unassignedClassroomCount: number;
  unassignedProfessorCount: number;
  createdAt: string;
  createdBy: string | null;
  updatedAt: string;
  updatedBy: string | null;
  active: boolean;
}

export interface GeneratedScheduleSnapshot {
  periodDurationM: number;
  morningStartTime: string;
  morningEndTime: string;
  afternoonStartTime: string;
  afternoonEndTime: string;
}

export interface GeneratedScheduleSlot {
  slotIndex: number;
  startMinuteOfDay: number;
  endMinuteOfDay: number;
  startTime: string;
  endTime: string;
  label: string;
}

export interface GeneratedScheduleItem {
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
  configClassroomId: string | null;
  classroomName?: string | null;
  configProfessorId: string;
  professorName: string;
  assignmentStatus: string;
  isFixed: boolean;
  semester: number;
  isMandatory: boolean;
  isCommonArea: boolean;
  careerCodes: number[];
}

export interface GeneratedScheduleDetail {
  generatedScheduleId: string;
  scheduleConfigId: string;
  snapshot: GeneratedScheduleSnapshot;
  status: string;
  fitness: number;
  hardPenalty: number;
  softPenalty: number;
  feasibilityPenalty: number;
  requiredGeneCount: number;
  assignedGeneCount: number;
  unassignedClassroomCount: number;
  unassignedProfessorCount: number;
  slots: GeneratedScheduleSlot[];
  items: GeneratedScheduleItem[];
  warnings: unknown[];
  createdAt: string;
  updatedAt: string;
}
