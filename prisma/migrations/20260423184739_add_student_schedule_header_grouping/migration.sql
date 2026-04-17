/*
  Warnings:

  - You are about to drop the column `generatedScheduleId` on the `StudentGeneratedSchedule` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `StudentGeneratedSchedule` table. All the data in the column will be lost.
  - Added the required column `studentGeneratedScheduleHeaderId` to the `StudentGeneratedSchedule` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "StudentGeneratedSchedule" DROP COLUMN "generatedScheduleId",
DROP COLUMN "name",
ADD COLUMN     "studentGeneratedScheduleHeaderId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "StudentGeneratedScheduleHeader" (
    "studentGeneratedScheduleHeaderId" SERIAL NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "generatedScheduleId" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "studentPensumId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "StudentGeneratedScheduleHeader_pkey" PRIMARY KEY ("studentGeneratedScheduleHeaderId")
);

-- AddForeignKey
ALTER TABLE "StudentGeneratedScheduleHeader" ADD CONSTRAINT "StudentGeneratedScheduleHeader_studentPensumId_fkey" FOREIGN KEY ("studentPensumId") REFERENCES "StudentPensum"("studentPensumId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGeneratedScheduleHeader" ADD CONSTRAINT "StudentGeneratedScheduleHeader_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentGeneratedSchedule" ADD CONSTRAINT "StudentGeneratedSchedule_studentGeneratedScheduleHeaderId_fkey" FOREIGN KEY ("studentGeneratedScheduleHeaderId") REFERENCES "StudentGeneratedScheduleHeader"("studentGeneratedScheduleHeaderId") ON DELETE RESTRICT ON UPDATE CASCADE;
