-- CreateTable
CREATE TABLE "StudentGeneratedSchedule" (
    "studentGeneratedScheduleId" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "generatedScheduleId" VARCHAR(50) NOT NULL,
    "scheduleConfigId" VARCHAR(50) NOT NULL,
    "isBest" BOOLEAN NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "periodDurationM" INTEGER NOT NULL,
    "morningStartTime" TIMESTAMP(3) NOT NULL,
    "morningEndTime" TIMESTAMP(3) NOT NULL,
    "afternoonStartTime" TIMESTAMP(3) NOT NULL,
    "afternoonEndTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" INTEGER NOT NULL,
    "studentPensumId" INTEGER NOT NULL,

    CONSTRAINT "StudentGeneratedSchedule_pkey" PRIMARY KEY ("studentGeneratedScheduleId")
);

-- CreateTable
CREATE TABLE "StudentGeneratedScheduleItem" (
    "studentGeneratedScheduleItemId" SERIAL NOT NULL,
    "generatedScheduleItemId" VARCHAR(50) NOT NULL,
    "configCourseId" VARCHAR(50) NOT NULL,
    "courseCode" INTEGER NOT NULL,
    "courseName" VARCHAR(255) NOT NULL,
    "sectionIndex" INTEGER NOT NULL,
    "sessionType" VARCHAR(20) NOT NULL,
    "dayIndex" INTEGER NOT NULL,
    "startSlot" INTEGER NOT NULL,
    "periodCount" INTEGER NOT NULL,
    "requireClassroom" BOOLEAN NOT NULL,
    "classroomName" VARCHAR(150),
    "professorName" VARCHAR(150) NOT NULL,
    "isMandatory" BOOLEAN NOT NULL,
    "studentGeneratedScheduleId" INTEGER NOT NULL,

    CONSTRAINT "StudentGeneratedScheduleItem_pkey" PRIMARY KEY ("studentGeneratedScheduleItemId")
);

-- AddForeignKey
ALTER TABLE "StudentGeneratedSchedule" ADD CONSTRAINT "StudentGeneratedSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGeneratedSchedule" ADD CONSTRAINT "StudentGeneratedSchedule_studentPensumId_fkey" FOREIGN KEY ("studentPensumId") REFERENCES "StudentPensum"("studentPensumId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGeneratedScheduleItem" ADD CONSTRAINT "StudentGeneratedScheduleItem_studentGeneratedScheduleId_fkey" FOREIGN KEY ("studentGeneratedScheduleId") REFERENCES "StudentGeneratedSchedule"("studentGeneratedScheduleId") ON DELETE CASCADE ON UPDATE CASCADE;
