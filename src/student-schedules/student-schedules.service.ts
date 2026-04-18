import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client';
import type { JwtPayload } from '../auth/auth.service';
import type { GeneratedScheduleItem } from '../class-schedules/entities/class-schedule.entity';
import { ClassSchedulesService } from '../class-schedules/class-schedules.service';
import { PrismaService } from '../prisma/prisma.service';
import { buildSlotCatalog } from '../utils/build-slot-catalog';
import { CreateStudentScheduleDto } from './dto/create-student-schedule.dto';
import { FilterStudentScheduleDto } from './dto/filter-student-schedule.dto';
import type {
  StoredStudentSchedule,
  StoredStudentScheduleHeader,
  StoredStudentScheduleHeaderDetail,
  StudentScheduleAlternative,
  StudentScheduleCourseSelection,
  StudentScheduleCreateResponse,
  StudentScheduleUnscheduledCourse,
} from './entities/student-schedule.entity';

interface CourseOption {
  optionId: string;
  courseCode: number;
  courseName: string;
  sectionIndex: number;
  items: GeneratedScheduleItem[];
  expandedBlocks: ExpandedBlock[];
  isMandatory: boolean;
  postrequisitesCount: number;
}

interface CourseOptionGroup {
  courseCode: number;
  courseName: string;
  options: CourseOption[];
}

interface ExpandedBlock {
  day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY';
  startSlot: number;
  endSlot: number;
}

interface ScheduleCandidate {
  selectedOptionIdsByCourseCode: Map<number, string>;
  score: number;
  overlapCount: number;
  gapCount: number;
  mandatoryCoursesCount: number;
  postrequisitesTotal: number;
}

interface PersistableScheduleResult {
  isBest: boolean;
  alternative: StudentScheduleAlternative;
}

const GA_POPULATION_SIZE = 120;
const GA_GENERATIONS = 200;
const GA_TOURNAMENT_SIZE = 4;
const GA_MUTATION_RATE = 0.15;
const GA_ELITISM_RATIO = 0.1;
const GA_STAGNATION_LIMIT = 30;
const ALTERNATIVE_SCHEDULES_LIMIT = 5;

const OVERLAP_PENALTY = 1000;
const MANDATORY_BONUS = 80;
const POSTREQUISITES_BONUS_MULTIPLIER = 10;
const GAP_PENALTY = 8;

@Injectable()
export class StudentSchedulesService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly classSchedulesService: ClassSchedulesService,
  ) {}

  async create(
    createStudentScheduleDto: CreateStudentScheduleDto,
    user: JwtPayload,
  ): Promise<StudentScheduleCreateResponse> {
    if (!user.studentId) {
      throw new UnauthorizedException('Usuario STUDENT sin studentId en token');
    }

    const uniqueCourseCodes = this.ensureNoDuplicateCourseCodes(
      createStudentScheduleDto.courseCodes,
    );

    const studentPensum = await this.prismaService.studentPensum.findUnique({
      where: { studentPensumId: createStudentScheduleDto.studentPensumId },
    });

    if (!studentPensum) {
      throw new NotFoundException(
        `El studentPensum con id ${createStudentScheduleDto.studentPensumId} no existe`,
      );
    }

    if (studentPensum.studentId !== user.studentId) {
      throw new UnauthorizedException(
        'El studentPensum no pertenece al estudiante autenticado',
      );
    }

    const generatedSchedule = await this.classSchedulesService.findOne(
      createStudentScheduleDto.scheduleId,
    );

    const assignedItems = generatedSchedule.items.filter(
      (item) => item.assignmentStatus === 'ASSIGNED',
    );

    this.validateCoursesAreInSchedule(uniqueCourseCodes, assignedItems);

    const pensumCourses = await this.prismaService.pensumCourse.findMany({
      where: {
        pensumId: studentPensum.pensumId,
        courseCode: { in: uniqueCourseCodes },
      },
      include: {
        prerequisites: {
          select: {
            prerequisiteId: true,
          },
        },
      },
    });

    this.validateCoursesAreInPensum(uniqueCourseCodes, pensumCourses);

    const approvedGrades = await this.prismaService.studentGrade.findMany({
      where: {
        studentPensumId: studentPensum.studentPensumId,
        isApproved: true,
      },
      include: {
        pensumCourse: {
          select: {
            pensumCourseId: true,
            courseCode: true,
            credits: true,
          },
        },
      },
    });

    this.validateCoursesAreNotApproved(uniqueCourseCodes, approvedGrades);

    this.validateCourseAvailabilityByPrerequisitesAndCredits(
      pensumCourses,
      approvedGrades,
    );

    const postrequisitesCountByPensumCourseId =
      await this.getPostrequisitesCountByPensumCourseId(
        pensumCourses.map((course) => course.pensumCourseId),
      );

    const scheduleCourseOptions = this.buildScheduleCourseOptions({
      selectedCourseCodes: uniqueCourseCodes,
      scheduleItems: assignedItems,
      pensumCourses,
      postrequisitesCountByPensumCourseId,
    });

    const candidateResults = this.runGeneticAlgorithm(scheduleCourseOptions);
    const bestCandidate = candidateResults[0];

    if (!bestCandidate) {
      throw new ConflictException(
        'No fue posible generar un horario con los cursos solicitados',
      );
    }

    const bestSchedule = this.toScheduleAlternative(
      bestCandidate,
      scheduleCourseOptions,
    );

    const alternativeSchedules = candidateResults
      .slice(1, ALTERNATIVE_SCHEDULES_LIMIT + 1)
      .map((candidate) =>
        this.toScheduleAlternative(candidate, scheduleCourseOptions),
      );

    const persistedResult = await this.persistGeneratedSchedules({
      dto: createStudentScheduleDto,
      user,
      generatedSchedule,
      schedules: [
        { isBest: true, alternative: bestSchedule },
        ...alternativeSchedules.map((alternative) => ({
          isBest: false,
          alternative,
        })),
      ],
    });

    return {
      scheduleId: createStudentScheduleDto.scheduleId,
      studentPensumId: createStudentScheduleDto.studentPensumId,
      header: persistedResult.header,
      generatedSchedules: persistedResult.schedules,
      bestSchedule,
      alternativeSchedules,
      message: 'Horario generado y almacenado correctamente',
    };
  }

  async findAll(filters: FilterStudentScheduleDto, user: JwtPayload) {
    const where: Prisma.StudentGeneratedScheduleHeaderWhereInput = {
      ...(filters.studentPensumId !== undefined
        ? { studentPensumId: filters.studentPensumId }
        : {}),
      ...(user.role === 'ADMIN' ? {} : { userId: user.sub }),
      ...((filters.active ?? true)
        ? {
            schedules: {
              some: {
                active: true,
              },
            },
          }
        : {}),
    };

    return this.prismaService.studentGeneratedScheduleHeader.findMany({
      where,
      include: {
        studentPensum: {
          include: { pensum: true },
        },
      },
      orderBy: [
        { createdAt: 'desc' },
        { studentGeneratedScheduleHeaderId: 'desc' },
      ],
    });
  }

  async findOne(id: number, user: JwtPayload) {
    const header =
      await this.prismaService.studentGeneratedScheduleHeader.findUnique({
        where: { studentGeneratedScheduleHeaderId: id },
        include: {
          studentPensum: {
            include: { pensum: true },
          },
          schedules: {
            include: {
              items: true,
            },
            orderBy: [
              { isBest: 'desc' },
              { createdAt: 'asc' },
              { studentGeneratedScheduleId: 'asc' },
            ],
          },
        },
      });

    if (!header) {
      throw new NotFoundException(
        `El grupo de horarios generado con id ${id} no existe`,
      );
    }

    if (user.role !== 'ADMIN' && header.userId !== user.sub) {
      throw new ForbiddenException(
        'No autorizado para consultar este grupo de horarios',
      );
    }

    const schedules = header.schedules
      .filter((schedule) => schedule.active)
      .map((schedule) => this.mapStoredSchedule(schedule));

    return {
      ...this.mapStoredHeader(header),
      schedules,
    } satisfies StoredStudentScheduleHeaderDetail;
  }

  private async persistGeneratedSchedules(params: {
    dto: CreateStudentScheduleDto;
    user: JwtPayload;
    generatedSchedule: {
      generatedScheduleId: string;
      scheduleConfigId: string;
      snapshot: {
        periodDurationM: number;
        morningStartTime: string;
        morningEndTime: string;
        afternoonStartTime: string;
        afternoonEndTime: string;
      };
    };
    schedules: PersistableScheduleResult[];
  }) {
    const { dto, generatedSchedule, schedules, user } = params;

    const morningStartTime = new Date(
      generatedSchedule.snapshot.morningStartTime,
    );
    const morningEndTime = new Date(generatedSchedule.snapshot.morningEndTime);
    const afternoonStartTime = new Date(
      generatedSchedule.snapshot.afternoonStartTime,
    );
    const afternoonEndTime = new Date(
      generatedSchedule.snapshot.afternoonEndTime,
    );

    const createdResult = await this.prismaService.$transaction(async (tx) => {
      const header = await tx.studentGeneratedScheduleHeader.create({
        data: {
          name: dto.name,
          generatedScheduleId: generatedSchedule.generatedScheduleId,
          studentPensumId: dto.studentPensumId,
          userId: user.sub,
        },
      });

      const created = [] as Array<
        Prisma.StudentGeneratedScheduleGetPayload<{
          include: { items: true };
        }>
      >;

      for (const schedule of schedules) {
        const scheduleItemsToStore = this.flattenAlternativeItems(
          schedule.alternative,
        );

        const createdSchedule = await tx.studentGeneratedSchedule.create({
          data: {
            studentGeneratedScheduleHeaderId:
              header.studentGeneratedScheduleHeaderId,
            scheduleConfigId: generatedSchedule.scheduleConfigId,
            userId: user.sub,
            studentPensumId: dto.studentPensumId,
            isBest: schedule.isBest,
            active: true,
            periodDurationM: generatedSchedule.snapshot.periodDurationM,
            morningStartTime,
            morningEndTime,
            afternoonStartTime,
            afternoonEndTime,
            items: {
              createMany: {
                data: scheduleItemsToStore,
              },
            },
          },
          include: {
            items: true,
          },
        });

        created.push(createdSchedule);
      }

      return {
        header,
        schedules: created,
      };
    });

    return {
      header: this.mapStoredHeader(createdResult.header),
      schedules: createdResult.schedules.map((schedule) =>
        this.mapStoredSchedule(schedule),
      ),
    };
  }

  private flattenAlternativeItems(alternative: StudentScheduleAlternative) {
    const itemsToStore: Array<{
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
    }> = [];

    for (const course of alternative.includedCourses) {
      for (const item of course.items) {
        itemsToStore.push({
          generatedScheduleItemId: item.generatedScheduleItemId,
          configCourseId: item.configCourseId,
          courseCode: item.courseCode,
          courseName: item.courseName,
          sectionIndex: item.sectionIndex,
          sessionType: item.sessionType,
          dayIndex: item.dayIndex,
          startSlot: item.startSlot,
          periodCount: item.periodCount,
          requireClassroom: item.requireClassroom,
          classroomName: item.classroomName ?? null,
          professorName: item.professorName,
          isMandatory: course.isMandatory,
        });
      }
    }

    return itemsToStore;
  }

  private mapStoredHeader(header: {
    studentGeneratedScheduleHeaderId: number;
    name: string;
    generatedScheduleId: string;
    studentPensumId: number;
    userId: number;
    createdAt: Date;
  }): StoredStudentScheduleHeader {
    return {
      studentGeneratedScheduleHeaderId: header.studentGeneratedScheduleHeaderId,
      name: header.name,
      generatedScheduleId: header.generatedScheduleId,
      studentPensumId: header.studentPensumId,
      userId: header.userId,
      createdAt: header.createdAt,
    };
  }

  private mapStoredSchedule(schedule: {
    studentGeneratedScheduleId: number;
    studentGeneratedScheduleHeaderId: number;
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
    items: Array<{
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
    }>;
  }): StoredStudentSchedule {
    return {
      studentGeneratedScheduleId: schedule.studentGeneratedScheduleId,
      studentGeneratedScheduleHeaderId:
        schedule.studentGeneratedScheduleHeaderId,
      scheduleConfigId: schedule.scheduleConfigId,
      studentPensumId: schedule.studentPensumId,
      userId: schedule.userId,
      isBest: schedule.isBest,
      active: schedule.active,
      periodDurationM: schedule.periodDurationM,
      morningStartTime: schedule.morningStartTime,
      morningEndTime: schedule.morningEndTime,
      afternoonStartTime: schedule.afternoonStartTime,
      afternoonEndTime: schedule.afternoonEndTime,
      createdAt: schedule.createdAt,
      slots: buildSlotCatalog({
        periodDurationM: schedule.periodDurationM,
        morningStartTime: schedule.morningStartTime,
        morningEndTime: schedule.morningEndTime,
        afternoonStartTime: schedule.afternoonStartTime,
        afternoonEndTime: schedule.afternoonEndTime,
      }),
      items: schedule.items,
    };
  }

  private ensureNoDuplicateCourseCodes(courseCodes: number[]) {
    const uniqueCourseCodes = Array.from(new Set(courseCodes));

    if (uniqueCourseCodes.length !== courseCodes.length) {
      throw new ConflictException('No se permiten codigos de curso duplicados');
    }

    return uniqueCourseCodes;
  }

  private validateCoursesAreInSchedule(
    selectedCourseCodes: number[],
    generatedScheduleItems: { courseCode: number }[],
  ) {
    const availableCourseCodesInSchedule = new Set(
      generatedScheduleItems.map((item) => item.courseCode),
    );

    const missingCourseCodes = selectedCourseCodes.filter(
      (courseCode) => !availableCourseCodesInSchedule.has(courseCode),
    );

    if (missingCourseCodes.length > 0) {
      throw new ConflictException(
        `Los siguientes cursos no están en el horario seleccionado: ${missingCourseCodes.join(', ')}`,
      );
    }
  }

  private validateCoursesAreInPensum(
    selectedCourseCodes: number[],
    pensumCourses: { courseCode: number }[],
  ) {
    const availableCourseCodesInPensum = new Set(
      pensumCourses.map((course) => course.courseCode),
    );

    const missingCourseCodes = selectedCourseCodes.filter(
      (courseCode) => !availableCourseCodesInPensum.has(courseCode),
    );

    if (missingCourseCodes.length > 0) {
      throw new ConflictException(
        `Los siguientes cursos no pertenecen al pensum del estudiante: ${missingCourseCodes.join(', ')}`,
      );
    }
  }

  private validateCoursesAreNotApproved(
    selectedCourseCodes: number[],
    approvedGrades: { pensumCourse: { courseCode: number } }[],
  ) {
    const approvedCourseCodes = new Set(
      approvedGrades.map((grade) => grade.pensumCourse.courseCode),
    );

    const alreadyApprovedCourseCodes = selectedCourseCodes.filter(
      (courseCode) => approvedCourseCodes.has(courseCode),
    );

    if (alreadyApprovedCourseCodes.length > 0) {
      throw new ConflictException(
        `Los siguientes cursos ya fueron aprobados: ${alreadyApprovedCourseCodes.join(', ')}`,
      );
    }
  }

  private validateCourseAvailabilityByPrerequisitesAndCredits(
    pensumCourses: {
      pensumCourseId: number;
      courseCode: number;
      requiredCreds: number;
      prerequisites: { prerequisiteId: number }[];
    }[],
    approvedGrades: {
      pensumCourse: { pensumCourseId: number; credits: number };
    }[],
  ) {
    const approvedPensumCourseIds = new Set(
      approvedGrades.map((grade) => grade.pensumCourse.pensumCourseId),
    );

    const approvedCreditsByCourse = new Map<number, number>();
    for (const grade of approvedGrades) {
      approvedCreditsByCourse.set(
        grade.pensumCourse.pensumCourseId,
        grade.pensumCourse.credits,
      );
    }

    const approvedCredits = Array.from(approvedCreditsByCourse.values()).reduce(
      (sum, credits) => sum + credits,
      0,
    );

    for (const pensumCourse of pensumCourses) {
      const missingPrerequisites = pensumCourse.prerequisites
        .map((prerequisite) => prerequisite.prerequisiteId)
        .filter(
          (prerequisiteId) => !approvedPensumCourseIds.has(prerequisiteId),
        );

      if (missingPrerequisites.length > 0) {
        throw new ConflictException(
          `No se puede incluir el curso ${pensumCourse.courseCode} porque no tiene todos los prerrequisitos aprobados`,
        );
      }

      if (
        pensumCourse.requiredCreds > 0 &&
        approvedCredits < pensumCourse.requiredCreds
      ) {
        throw new ConflictException(
          `No se puede incluir el curso ${pensumCourse.courseCode} porque no cumple con los creditos requeridos`,
        );
      }
    }
  }

  private async getPostrequisitesCountByPensumCourseId(
    pensumCourseIds: number[],
  ) {
    if (pensumCourseIds.length === 0) {
      return new Map<number, number>();
    }

    const postrequisites =
      await this.prismaService.pensumCoursePrerequisite.findMany({
        where: {
          prerequisiteId: { in: pensumCourseIds },
        },
        select: {
          prerequisiteId: true,
        },
      });

    const postrequisitesCountByPensumCourseId = new Map<number, number>();

    for (const relation of postrequisites) {
      const currentCount =
        postrequisitesCountByPensumCourseId.get(relation.prerequisiteId) ?? 0;
      postrequisitesCountByPensumCourseId.set(
        relation.prerequisiteId,
        currentCount + 1,
      );
    }

    return postrequisitesCountByPensumCourseId;
  }

  private buildScheduleCourseOptions(params: {
    selectedCourseCodes: number[];
    scheduleItems: GeneratedScheduleItem[];
    pensumCourses: {
      pensumCourseId: number;
      courseCode: number;
      isMandatory: boolean;
    }[];
    postrequisitesCountByPensumCourseId: Map<number, number>;
  }): CourseOptionGroup[] {
    const { scheduleItems, selectedCourseCodes } = params;
    const pensumCourseByCode = new Map(
      params.pensumCourses.map((pensumCourse) => [
        pensumCourse.courseCode,
        pensumCourse,
      ]),
    );

    const groupedByCourseAndSection = new Map<
      string,
      GeneratedScheduleItem[]
    >();

    for (const item of scheduleItems) {
      if (!selectedCourseCodes.includes(item.courseCode)) {
        continue;
      }

      const key = `${item.courseCode}-${item.sectionIndex}`;
      const groupedItems = groupedByCourseAndSection.get(key) ?? [];
      groupedItems.push(item);
      groupedByCourseAndSection.set(key, groupedItems);
    }

    const optionsByCourse = new Map<number, CourseOption[]>();

    for (const groupedItems of groupedByCourseAndSection.values()) {
      const firstItem = groupedItems[0];

      if (!firstItem) {
        continue;
      }

      const pensumCourse = pensumCourseByCode.get(firstItem.courseCode);
      if (!pensumCourse) {
        continue;
      }

      const classItems = groupedItems.filter(
        (item) => item.sessionType === 'CLASS',
      );

      if (classItems.length === 0) {
        continue;
      }

      const option: CourseOption = {
        optionId: this.buildOptionId(groupedItems),
        courseCode: firstItem.courseCode,
        courseName: firstItem.courseName,
        sectionIndex: firstItem.sectionIndex,
        items: groupedItems,
        expandedBlocks: this.expandItemsToBlocks(groupedItems),
        isMandatory: pensumCourse.isMandatory,
        postrequisitesCount:
          params.postrequisitesCountByPensumCourseId.get(
            pensumCourse.pensumCourseId,
          ) ?? 0,
      };

      const options = optionsByCourse.get(firstItem.courseCode) ?? [];
      options.push(option);
      optionsByCourse.set(firstItem.courseCode, options);
    }

    const groups: CourseOptionGroup[] = [];
    for (const courseCode of selectedCourseCodes) {
      const options = optionsByCourse.get(courseCode) ?? [];

      if (options.length === 0) {
        throw new ConflictException(
          `El curso ${courseCode} no tiene secciones de clase disponibles en el horario`,
        );
      }

      groups.push({
        courseCode,
        courseName: options[0]?.courseName ?? `Curso ${courseCode}`,
        options,
      });
    }

    return groups;
  }

  private buildOptionId(items: GeneratedScheduleItem[]) {
    const base = items
      .map((item) => item.generatedScheduleItemId)
      .sort((a, b) => a.localeCompare(b))
      .join('-');

    const first = items[0];
    if (!first) {
      return `empty-${Math.random().toString(36).slice(2)}`;
    }

    return `${first.courseCode}-${first.sectionIndex}-${base}`;
  }

  private expandItemsToBlocks(items: GeneratedScheduleItem[]): ExpandedBlock[] {
    const blocks: ExpandedBlock[] = [];

    for (const item of items) {
      const endSlot = item.startSlot + item.periodCount - 1;
      const days = this.expandItemDays(item.dayIndex);

      for (const day of days) {
        blocks.push({
          day,
          startSlot: item.startSlot,
          endSlot,
        });
      }
    }

    return blocks;
  }

  private expandItemDays(dayIndex: number): ExpandedBlock['day'][] {
    if (dayIndex === 0) {
      return ['MONDAY', 'WEDNESDAY', 'FRIDAY'];
    }

    if (dayIndex === 1) {
      return ['TUESDAY'];
    }

    if (dayIndex === 2) {
      return ['THURSDAY'];
    }

    return [];
  }

  private runGeneticAlgorithm(
    groups: CourseOptionGroup[],
  ): ScheduleCandidate[] {
    const courseCodes = groups.map((group) => group.courseCode);
    const optionsByOptionId = new Map<string, CourseOption>();

    for (const group of groups) {
      for (const option of group.options) {
        optionsByOptionId.set(option.optionId, option);
      }
    }

    let population = this.createInitialPopulation(groups);
    let bestScore = Number.NEGATIVE_INFINITY;
    let generationsWithoutImprovement = 0;

    for (let generation = 0; generation < GA_GENERATIONS; generation += 1) {
      population = population.map((candidate) =>
        this.evaluateCandidate(candidate, optionsByOptionId, courseCodes),
      );
      population.sort((a, b) => b.score - a.score);

      const currentBestScore = population[0]?.score ?? Number.NEGATIVE_INFINITY;
      if (currentBestScore > bestScore) {
        bestScore = currentBestScore;
        generationsWithoutImprovement = 0;
      } else {
        generationsWithoutImprovement += 1;
      }

      if (generationsWithoutImprovement >= GA_STAGNATION_LIMIT) {
        break;
      }

      const eliteCount = Math.max(
        1,
        Math.floor(GA_POPULATION_SIZE * GA_ELITISM_RATIO),
      );
      const elites = population.slice(0, eliteCount).map((candidate) => ({
        selectedOptionIdsByCourseCode: new Map(
          candidate.selectedOptionIdsByCourseCode,
        ),
        score: candidate.score,
        overlapCount: candidate.overlapCount,
        gapCount: candidate.gapCount,
        mandatoryCoursesCount: candidate.mandatoryCoursesCount,
        postrequisitesTotal: candidate.postrequisitesTotal,
      }));

      const newPopulation: ScheduleCandidate[] = [...elites];

      while (newPopulation.length < GA_POPULATION_SIZE) {
        const parentA = this.tournamentSelection(population);
        const parentB = this.tournamentSelection(population);

        const child = this.crossover(parentA, parentB, courseCodes);
        this.mutate(child, groups);

        newPopulation.push(child);
      }

      population = newPopulation;
    }

    population = population.map((candidate) =>
      this.evaluateCandidate(candidate, optionsByOptionId, courseCodes),
    );
    population.sort((a, b) => b.score - a.score);

    const unique = new Map<string, ScheduleCandidate>();
    for (const candidate of population) {
      const signature = this.candidateSignature(candidate, courseCodes);
      if (!unique.has(signature)) {
        unique.set(signature, candidate);
      }
    }

    return Array.from(unique.values());
  }

  private createInitialPopulation(
    groups: CourseOptionGroup[],
  ): ScheduleCandidate[] {
    const population: ScheduleCandidate[] = [];

    for (let i = 0; i < GA_POPULATION_SIZE; i += 1) {
      const selectedOptionIdsByCourseCode = new Map<number, string>();

      for (const group of groups) {
        const randomOption =
          group.options[Math.floor(Math.random() * group.options.length)];

        if (randomOption) {
          selectedOptionIdsByCourseCode.set(
            group.courseCode,
            randomOption.optionId,
          );
        }
      }

      population.push({
        selectedOptionIdsByCourseCode,
        score: 0,
        overlapCount: 0,
        gapCount: 0,
        mandatoryCoursesCount: 0,
        postrequisitesTotal: 0,
      });
    }

    return population;
  }

  private evaluateCandidate(
    candidate: ScheduleCandidate,
    optionsByOptionId: Map<string, CourseOption>,
    courseCodes: number[],
  ): ScheduleCandidate {
    const selectedOptions = this.getSelectedOptions(
      candidate,
      optionsByOptionId,
    );

    let overlapCount = 0;
    const occupied = new Map<string, number>();

    for (const option of selectedOptions) {
      for (const block of option.expandedBlocks) {
        for (let slot = block.startSlot; slot <= block.endSlot; slot += 1) {
          const key = `${block.day}-${slot}`;
          const current = occupied.get(key) ?? 0;
          occupied.set(key, current + 1);
        }
      }
    }

    for (const count of occupied.values()) {
      if (count > 1) {
        overlapCount += count - 1;
      }
    }

    const gapCount = this.computeGapCount(selectedOptions);
    const mandatoryCoursesCount = selectedOptions.filter(
      (option) => option.isMandatory,
    ).length;
    const postrequisitesTotal = selectedOptions.reduce(
      (sum, option) => sum + option.postrequisitesCount,
      0,
    );

    const selectedCoursesCount = selectedOptions.length;

    const score =
      selectedCoursesCount * 100 -
      overlapCount * OVERLAP_PENALTY +
      mandatoryCoursesCount * MANDATORY_BONUS +
      postrequisitesTotal * POSTREQUISITES_BONUS_MULTIPLIER -
      gapCount * GAP_PENALTY;

    const normalizedSelection = new Map<number, string>();
    for (const courseCode of courseCodes) {
      const optionId = candidate.selectedOptionIdsByCourseCode.get(courseCode);
      if (optionId && optionsByOptionId.has(optionId)) {
        normalizedSelection.set(courseCode, optionId);
      }
    }

    return {
      selectedOptionIdsByCourseCode: normalizedSelection,
      score,
      overlapCount,
      gapCount,
      mandatoryCoursesCount,
      postrequisitesTotal,
    };
  }

  private getSelectedOptions(
    candidate: ScheduleCandidate,
    optionsByOptionId: Map<string, CourseOption>,
  ) {
    const selectedOptions: CourseOption[] = [];
    for (const optionId of candidate.selectedOptionIdsByCourseCode.values()) {
      const option = optionsByOptionId.get(optionId);
      if (option) {
        selectedOptions.push(option);
      }
    }
    return selectedOptions;
  }

  private computeGapCount(selectedOptions: CourseOption[]) {
    const daySlots = new Map<ExpandedBlock['day'], number[]>();

    for (const option of selectedOptions) {
      for (const block of option.expandedBlocks) {
        const current = daySlots.get(block.day) ?? [];
        for (let slot = block.startSlot; slot <= block.endSlot; slot += 1) {
          current.push(slot);
        }
        daySlots.set(block.day, current);
      }
    }

    let gapCount = 0;

    for (const slots of daySlots.values()) {
      if (slots.length <= 1) {
        continue;
      }

      const uniqueSortedSlots = Array.from(new Set(slots)).sort(
        (a, b) => a - b,
      );
      for (let i = 1; i < uniqueSortedSlots.length; i += 1) {
        const prev = uniqueSortedSlots[i - 1];
        const current = uniqueSortedSlots[i];

        if (prev !== undefined && current !== undefined && current - prev > 1) {
          gapCount += current - prev - 1;
        }
      }
    }

    return gapCount;
  }

  private tournamentSelection(population: ScheduleCandidate[]) {
    let best = population[Math.floor(Math.random() * population.length)];

    for (let i = 1; i < GA_TOURNAMENT_SIZE; i += 1) {
      const contender =
        population[Math.floor(Math.random() * population.length)];
      if (contender && best && contender.score > best.score) {
        best = contender;
      }
    }

    return best ?? population[0];
  }

  private crossover(
    parentA: ScheduleCandidate,
    parentB: ScheduleCandidate,
    courseCodes: number[],
  ): ScheduleCandidate {
    const childSelection = new Map<number, string>();

    for (const courseCode of courseCodes) {
      const fromA = parentA.selectedOptionIdsByCourseCode.get(courseCode);
      const fromB = parentB.selectedOptionIdsByCourseCode.get(courseCode);
      const chosen = Math.random() < 0.5 ? fromA : fromB;

      if (chosen) {
        childSelection.set(courseCode, chosen);
      }
    }

    return {
      selectedOptionIdsByCourseCode: childSelection,
      score: 0,
      overlapCount: 0,
      gapCount: 0,
      mandatoryCoursesCount: 0,
      postrequisitesTotal: 0,
    };
  }

  private mutate(candidate: ScheduleCandidate, groups: CourseOptionGroup[]) {
    if (Math.random() >= GA_MUTATION_RATE) {
      return;
    }

    const randomGroup = groups[Math.floor(Math.random() * groups.length)];
    if (!randomGroup || randomGroup.options.length === 0) {
      return;
    }

    const randomOption =
      randomGroup.options[
        Math.floor(Math.random() * randomGroup.options.length)
      ];
    if (!randomOption) {
      return;
    }

    candidate.selectedOptionIdsByCourseCode.set(
      randomGroup.courseCode,
      randomOption.optionId,
    );
  }

  private candidateSignature(
    candidate: ScheduleCandidate,
    courseCodes: number[],
  ) {
    return courseCodes
      .map((courseCode) => {
        const optionId =
          candidate.selectedOptionIdsByCourseCode.get(courseCode) ?? 'none';
        return `${courseCode}:${optionId}`;
      })
      .join('|');
  }

  private toScheduleAlternative(
    candidate: ScheduleCandidate,
    groups: CourseOptionGroup[],
  ): StudentScheduleAlternative {
    const optionsByOptionId = new Map<string, CourseOption>();
    for (const group of groups) {
      for (const option of group.options) {
        optionsByOptionId.set(option.optionId, option);
      }
    }

    const includedOptions = this.getSelectedOptions(
      candidate,
      optionsByOptionId,
    );
    const includedCourses: StudentScheduleCourseSelection[] =
      includedOptions.map((option) => ({
        courseCode: option.courseCode,
        courseName: option.courseName,
        sectionIndex: option.sectionIndex,
        isMandatory: option.isMandatory,
        postrequisitesCount: option.postrequisitesCount,
        items: option.items,
      }));

    const includedCourseCodes = new Set(
      includedOptions.map((option) => option.courseCode),
    );

    const unscheduledCourses: StudentScheduleUnscheduledCourse[] = groups
      .filter((group) => !includedCourseCodes.has(group.courseCode))
      .map((group) => {
        const conflictsWith = this.estimateConflictsForCourse(
          group,
          includedOptions,
        );

        return {
          courseCode: group.courseCode,
          reason: 'No fue posible incluir el curso por traslapes de horario',
          conflictsWith,
        };
      });

    return {
      score: candidate.score,
      includedCourses,
      unscheduledCourses,
      metrics: {
        includedCoursesCount: includedCourses.length,
        mandatoryCoursesCount: candidate.mandatoryCoursesCount,
        postrequisitesTotal: candidate.postrequisitesTotal,
        gapCount: candidate.gapCount,
      },
    };
  }

  private estimateConflictsForCourse(
    group: CourseOptionGroup,
    includedOptions: CourseOption[],
  ) {
    const conflicts = new Set<number>();

    for (const groupOption of group.options) {
      for (const includedOption of includedOptions) {
        if (this.optionsOverlap(groupOption, includedOption)) {
          conflicts.add(includedOption.courseCode);
        }
      }
    }

    return Array.from(conflicts.values()).sort((a, b) => a - b);
  }

  private optionsOverlap(optionA: CourseOption, optionB: CourseOption) {
    for (const blockA of optionA.expandedBlocks) {
      for (const blockB of optionB.expandedBlocks) {
        if (blockA.day !== blockB.day) {
          continue;
        }

        if (
          blockA.startSlot <= blockB.endSlot &&
          blockB.startSlot <= blockA.endSlot
        ) {
          return true;
        }
      }
    }

    return false;
  }
}
