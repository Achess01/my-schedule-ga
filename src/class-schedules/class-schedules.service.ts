import { BadGatewayException, Injectable } from '@nestjs/common';
import { SCHEDULE_CLASS_URL } from '../constants';
import type {
  GeneratedScheduleDetail,
  GeneratedScheduleItem,
  GeneratedScheduleSlot,
  GeneratedScheduleSnapshot,
  GeneratedScheduleSummary,
} from './entities/class-schedule.entity';

@Injectable()
export class ClassSchedulesService {
  async findAll(): Promise<GeneratedScheduleSummary[]> {
    const payload = await this.fetchGeneratedSchedules(
      `${SCHEDULE_CLASS_URL}/generated-schedules`,
    );

    return this.mapFindAllResponse(payload);
  }

  async findOne(id: number): Promise<GeneratedScheduleDetail> {
    const payload = await this.fetchGeneratedSchedules(
      `${SCHEDULE_CLASS_URL}/generated-schedules/${id}`,
    );

    return this.mapFindOneResponse(payload);
  }

  private async fetchGeneratedSchedules(url: string): Promise<unknown> {
    let response: Response;

    try {
      response = await fetch(url);
    } catch {
      throw new BadGatewayException('Error al conectarse con los horarios');
    }

    if (!response.ok) {
      throw new BadGatewayException('Error al conectarse con los horarios');
    }

    try {
      return await response.json();
    } catch {
      throw new BadGatewayException(
        'Generated schedules service returned an invalid response',
      );
    }
  }

  private mapFindAllResponse(payload: unknown): GeneratedScheduleSummary[] {
    if (!Array.isArray(payload)) {
      throw new BadGatewayException('Invalid generated schedules payload');
    }

    return payload.map((item) => this.mapGeneratedScheduleSummary(item));
  }

  private mapFindOneResponse(payload: unknown): GeneratedScheduleDetail {
    return {
      generatedScheduleId: this.readString(payload, 'generatedScheduleId'),
      scheduleConfigId: this.readString(payload, 'scheduleConfigId'),
      snapshot: this.mapSnapshot(this.readObject(payload, 'snapshot')),
      status: this.readString(payload, 'status'),
      fitness: this.readNumber(payload, 'fitness'),
      hardPenalty: this.readNumber(payload, 'hardPenalty'),
      softPenalty: this.readNumber(payload, 'softPenalty'),
      feasibilityPenalty: this.readNumber(payload, 'feasibilityPenalty'),
      requiredGeneCount: this.readNumber(payload, 'requiredGeneCount'),
      assignedGeneCount: this.readNumber(payload, 'assignedGeneCount'),
      unassignedClassroomCount: this.readNumber(
        payload,
        'unassignedClassroomCount',
      ),
      unassignedProfessorCount: this.readNumber(
        payload,
        'unassignedProfessorCount',
      ),
      slots: this.mapSlots(this.readArray(payload, 'slots')),
      items: this.mapItems(this.readArray(payload, 'items')),
      warnings: this.readArray(payload, 'warnings'),
      createdAt: this.readString(payload, 'createdAt'),
      updatedAt: this.readString(payload, 'updatedAt'),
    };
  }

  private mapGeneratedScheduleSummary(
    payload: unknown,
  ): GeneratedScheduleSummary {
    return {
      generatedScheduleId: this.readString(payload, 'generatedScheduleId'),
      scheduleConfigId: this.readString(payload, 'scheduleConfigId'),
      periodDurationM: this.readNumber(payload, 'periodDurationM'),
      morningStartTime: this.readString(payload, 'morningStartTime'),
      morningEndTime: this.readString(payload, 'morningEndTime'),
      afternoonStartTime: this.readString(payload, 'afternoonStartTime'),
      afternoonEndTime: this.readString(payload, 'afternoonEndTime'),
      name: this.readString(payload, 'name'),
      status: this.readString(payload, 'status'),
      fitness: this.readNumber(payload, 'fitness'),
      hardPenalty: this.readNumber(payload, 'hardPenalty'),
      softPenalty: this.readNumber(payload, 'softPenalty'),
      feasibilityPenalty: this.readNumber(payload, 'feasibilityPenalty'),
      requiredGeneCount: this.readNumber(payload, 'requiredGeneCount'),
      assignedGeneCount: this.readNumber(payload, 'assignedGeneCount'),
      unassignedClassroomCount: this.readNumber(
        payload,
        'unassignedClassroomCount',
      ),
      unassignedProfessorCount: this.readNumber(
        payload,
        'unassignedProfessorCount',
      ),
      createdAt: this.readString(payload, 'createdAt'),
      createdBy: this.readNullableString(payload, 'createdBy'),
      updatedAt: this.readString(payload, 'updatedAt'),
      updatedBy: this.readNullableString(payload, 'updatedBy'),
      active: this.readBoolean(payload, 'active'),
    };
  }

  private mapSnapshot(
    payload: Record<string, unknown>,
  ): GeneratedScheduleSnapshot {
    return {
      periodDurationM: this.readNumber(payload, 'periodDurationM'),
      morningStartTime: this.readString(payload, 'morningStartTime'),
      morningEndTime: this.readString(payload, 'morningEndTime'),
      afternoonStartTime: this.readString(payload, 'afternoonStartTime'),
      afternoonEndTime: this.readString(payload, 'afternoonEndTime'),
    };
  }

  private mapSlots(payload: unknown[]): GeneratedScheduleSlot[] {
    return payload.map((slot) => ({
      slotIndex: this.readNumber(slot, 'slotIndex'),
      startMinuteOfDay: this.readNumber(slot, 'startMinuteOfDay'),
      endMinuteOfDay: this.readNumber(slot, 'endMinuteOfDay'),
      startTime: this.readString(slot, 'startTime'),
      endTime: this.readString(slot, 'endTime'),
      label: this.readString(slot, 'label'),
    }));
  }

  private mapItems(payload: unknown[]): GeneratedScheduleItem[] {
    return payload.map((item) => ({
      generatedScheduleItemId: this.readString(item, 'generatedScheduleItemId'),
      configCourseId: this.readString(item, 'configCourseId'),
      courseCode: this.readNumber(item, 'courseCode'),
      courseName: this.readString(item, 'courseName'),
      sectionIndex: this.readNumber(item, 'sectionIndex'),
      sessionType: this.readString(item, 'sessionType'),
      dayIndex: this.readNumberNullable(item, 'dayIndex') ?? 0,
      startSlot: this.readNumberNullable(item, 'startSlot') ?? 0,
      periodCount: this.readNumber(item, 'periodCount'),
      requireClassroom: this.readBoolean(item, 'requireClassroom'),
      configClassroomId: this.readNullableString(item, 'configClassroomId'),
      classroomName: this.readOptionalNullableString(item, 'classroomName'),
      configProfessorId:
        this.readNullableString(item, 'configProfessorId') ?? '',
      professorName: this.readNullableString(item, 'professorName') ?? '',
      assignmentStatus: this.readString(item, 'assignmentStatus'),
      isFixed: this.readBoolean(item, 'isFixed'),
      semester: this.readNumber(item, 'semester'),
      isMandatory: this.readBoolean(item, 'isMandatory'),
      isCommonArea: this.readBoolean(item, 'isCommonArea'),
      careerCodes: this.readNumberArray(item, 'careerCodes'),
    }));
  }

  private readString(payload: unknown, key: string): string {
    const value = this.readValue(payload, key);

    if (typeof value !== 'string') {
      throw new BadGatewayException('Invalid generated schedules payload');
    }

    return value;
  }

  private readNullableString(payload: unknown, key: string): string | null {
    const value = this.readValue(payload, key);

    if (value === null) {
      return null;
    }

    if (typeof value !== 'string') {
      throw new BadGatewayException('Invalid generated schedules payload');
    }

    return value;
  }

  private readOptionalNullableString(
    payload: unknown,
    key: string,
  ): string | null | undefined {
    const objectValue = this.asObject(payload);

    if (!(key in objectValue)) {
      return undefined;
    }

    const value = objectValue[key];

    if (value === null) {
      return null;
    }

    if (typeof value !== 'string') {
      throw new BadGatewayException('Invalid generated schedules payload');
    }

    return value;
  }

  private readNumber(payload: unknown, key: string): number {
    const value = this.readValue(payload, key);

    if (typeof value !== 'number' || Number.isNaN(value)) {
      throw new BadGatewayException('Invalid generated schedules payload');
    }

    return value;
  }

  private readNumberNullable(payload: unknown, key: string): number | null {
    const value = this.readValue(payload, key);

    if (value === null) {
      return null;
    }

    if (typeof value !== 'number' || Number.isNaN(value)) {
      return null;
    }

    return value;
  }

  private readBoolean(payload: unknown, key: string): boolean {
    const value = this.readValue(payload, key);

    if (typeof value !== 'boolean') {
      throw new BadGatewayException('Invalid generated schedules payload');
    }

    return value;
  }

  private readArray(payload: unknown, key: string): unknown[] {
    const value = this.readValue(payload, key);

    if (!Array.isArray(value)) {
      throw new BadGatewayException('Invalid generated schedules payload');
    }

    return value;
  }

  private readObject(payload: unknown, key: string): Record<string, unknown> {
    const value = this.readValue(payload, key);
    return this.asObject(value);
  }

  private readNumberArray(payload: unknown, key: string): number[] {
    const value = this.readArray(payload, key);

    if (
      !value.every((item) => typeof item === 'number' && !Number.isNaN(item))
    ) {
      throw new BadGatewayException('Invalid generated schedules payload');
    }

    return value as number[];
  }

  private readValue(payload: unknown, key: string): unknown {
    const objectValue = this.asObject(payload);

    if (!(key in objectValue)) {
      throw new BadGatewayException('Invalid generated schedules payload');
    }

    return objectValue[key];
  }

  private asObject(payload: unknown): Record<string, unknown> {
    if (
      payload === null ||
      typeof payload !== 'object' ||
      Array.isArray(payload)
    ) {
      throw new BadGatewayException('Invalid generated schedules payload');
    }

    return payload as Record<string, unknown>;
  }
}
