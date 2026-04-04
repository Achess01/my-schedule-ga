/*
  Warnings:

  - A unique constraint covering the columns `[studentId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "GradeType" AS ENUM ('Primer Semestre', 'Segundo Semestre', 'EDV Junio', 'EDV Diciembre');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "studentId" INTEGER;

-- CreateTable
CREATE TABLE "Student" (
    "studentId" INTEGER NOT NULL,
    "entryDate" DATE NOT NULL,
    "firstname" VARCHAR(100) NOT NULL,
    "lastname" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("studentId")
);

-- CreateTable
CREATE TABLE "StudentPensum" (
    "studentPensumId" SERIAL NOT NULL,
    "studentId" INTEGER NOT NULL,
    "pensumId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentPensum_pkey" PRIMARY KEY ("studentPensumId")
);

-- CreateTable
CREATE TABLE "StudentGrade" (
    "studentGradeId" SERIAL NOT NULL,
    "studentPensumId" INTEGER NOT NULL,
    "pensumCourseId" INTEGER NOT NULL,
    "isApproved" BOOLEAN NOT NULL,
    "gradeType" "GradeType" NOT NULL,
    "grade" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentGrade_pkey" PRIMARY KEY ("studentGradeId")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentPensum_studentId_pensumId_key" ON "StudentPensum"("studentId", "pensumId");

-- CreateIndex
CREATE UNIQUE INDEX "User_studentId_key" ON "User"("studentId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("studentId") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPensum" ADD CONSTRAINT "StudentPensum_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("studentId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentPensum" ADD CONSTRAINT "StudentPensum_pensumId_fkey" FOREIGN KEY ("pensumId") REFERENCES "Pensum"("pensumId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGrade" ADD CONSTRAINT "StudentGrade_studentPensumId_fkey" FOREIGN KEY ("studentPensumId") REFERENCES "StudentPensum"("studentPensumId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGrade" ADD CONSTRAINT "StudentGrade_pensumCourseId_fkey" FOREIGN KEY ("pensumCourseId") REFERENCES "PensumCourse"("pensumCourseId") ON DELETE RESTRICT ON UPDATE CASCADE;
