-- DropForeignKey
ALTER TABLE "PensumCoursePrerequisite" DROP CONSTRAINT "PensumCoursePrerequisite_pensumCourseId_fkey";

-- DropForeignKey
ALTER TABLE "PensumCoursePrerequisite" DROP CONSTRAINT "PensumCoursePrerequisite_prerequisiteId_fkey";

-- AddForeignKey
ALTER TABLE "PensumCoursePrerequisite" ADD CONSTRAINT "PensumCoursePrerequisite_pensumCourseId_fkey" FOREIGN KEY ("pensumCourseId") REFERENCES "PensumCourse"("pensumCourseId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PensumCoursePrerequisite" ADD CONSTRAINT "PensumCoursePrerequisite_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "PensumCourse"("pensumCourseId") ON DELETE CASCADE ON UPDATE CASCADE;
