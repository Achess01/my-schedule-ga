export const CLASS_DAY_INDEX = 0 as const;
export const LAB1_DAY_INDEX = 1 as const;
export const LAB2_DAY_INDEX = 2 as const;

export type DayIndex =
  | typeof CLASS_DAY_INDEX
  | typeof LAB1_DAY_INDEX
  | typeof LAB2_DAY_INDEX;

export const DAY_INDEXES: readonly DayIndex[] = [CLASS_DAY_INDEX] as const;

export interface Slot {
  dayIndex: DayIndex;
  slotIndex: number;
  startMinuteOfDay: number;
  endMinuteOfDay: number;
  isMorning: boolean;
}

export interface SlotCatalogInput {
  periodDurationM: number;
  morningStartTime: Date;
  morningEndTime: Date;
  afternoonStartTime: Date;
  afternoonEndTime: Date;
}

export interface SlotCatalogOutput {
  slotIndex: number;
  startMinuteOfDay: number;
  endMinuteOfDay: number;
  startTime: string;
  endTime: string;
  label: string;
}

export function buildSlotCatalog(input: SlotCatalogInput): SlotCatalogOutput[] {
  if (input.periodDurationM <= 0) {
    throw new RangeError('periodDurationM must be greater than 0.');
  }

  const morningStartMinuteOfDay = toMinuteOfDay(input.morningStartTime);
  const morningEndMinuteOfDay = toMinuteOfDay(input.morningEndTime);
  const afternoonStartMinuteOfDay = toMinuteOfDay(input.afternoonStartTime);
  const afternoonEndMinuteOfDay = toMinuteOfDay(input.afternoonEndTime);

  if (morningEndMinuteOfDay <= morningStartMinuteOfDay) {
    throw new RangeError(
      'morningEndTime must be greater than morningStartTime.',
    );
  }

  if (afternoonEndMinuteOfDay <= afternoonStartMinuteOfDay) {
    throw new RangeError(
      'afternoonEndTime must be greater than afternoonStartTime.',
    );
  }

  if (afternoonStartMinuteOfDay < morningEndMinuteOfDay) {
    throw new RangeError(
      'afternoonStartTime must be greater than or equal to morningEndTime.',
    );
  }

  const morningMinutes = morningEndMinuteOfDay - morningStartMinuteOfDay;
  const afternoonMinutes = afternoonEndMinuteOfDay - afternoonStartMinuteOfDay;

  const morningSlotCount = Math.floor(morningMinutes / input.periodDurationM);
  const afternoonSlotCount = Math.floor(
    afternoonMinutes / input.periodDurationM,
  );

  const byDay = {
    [CLASS_DAY_INDEX]: [] as Slot[],
  } as Record<DayIndex, Slot[]>;

  for (const dayIndex of DAY_INDEXES) {
    let slotIndex = 0;

    for (let i = 0; i < morningSlotCount; i += 1) {
      byDay[dayIndex].push({
        dayIndex,
        slotIndex,
        startMinuteOfDay: morningStartMinuteOfDay + i * input.periodDurationM,
        endMinuteOfDay:
          morningStartMinuteOfDay + (i + 1) * input.periodDurationM,
        isMorning: true,
      });
      slotIndex += 1;
    }

    for (let i = 0; i < afternoonSlotCount; i += 1) {
      byDay[dayIndex].push({
        dayIndex,
        slotIndex,
        startMinuteOfDay: afternoonStartMinuteOfDay + i * input.periodDurationM,
        endMinuteOfDay:
          afternoonStartMinuteOfDay + (i + 1) * input.periodDurationM,
        isMorning: false,
      });
      slotIndex += 1;
    }
  }

  return byDay[0].map((slot) => ({
    slotIndex: slot.slotIndex,
    startMinuteOfDay: slot.startMinuteOfDay,
    endMinuteOfDay: slot.endMinuteOfDay,
    startTime: toHourMinute(slot.startMinuteOfDay),
    endTime: toHourMinute(slot.endMinuteOfDay),
    label: `${toHourMinute(slot.startMinuteOfDay)}-${toHourMinute(slot.endMinuteOfDay)}`,
  }));
}

function toMinuteOfDay(value: Date): number {
  return value.getUTCHours() * 60 + value.getUTCMinutes();
}

function toHourMinute(minuteOfDay: number): string {
  const hours = Math.floor(minuteOfDay / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (minuteOfDay % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}
