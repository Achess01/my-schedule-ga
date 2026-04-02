-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(150) NOT NULL,
    "firstname" VARCHAR(100) NOT NULL,
    "lastname" VARCHAR(100) NOT NULL,
    "password" VARCHAR(100) NOT NULL,
    "roleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Career" (
    "careerId" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Career_pkey" PRIMARY KEY ("careerId")
);

-- CreateTable
CREATE TABLE "Course" (
    "courseCode" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "defaultCredits" INTEGER NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("courseCode")
);

-- CreateTable
CREATE TABLE "StudyArea" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255) NOT NULL,

    CONSTRAINT "StudyArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pensum" (
    "pensumId" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "creditsNeeded" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pensum_pkey" PRIMARY KEY ("pensumId")
);

-- CreateTable
CREATE TABLE "PensumCourse" (
    "pensumCourseId" SERIAL NOT NULL,
    "pensumId" INTEGER NOT NULL,
    "courseCode" INTEGER NOT NULL,
    "studyAreaId" INTEGER NOT NULL,
    "credits" INTEGER NOT NULL,
    "requiredCreds" INTEGER NOT NULL,
    "isMandatory" BOOLEAN NOT NULL,

    CONSTRAINT "PensumCourse_pkey" PRIMARY KEY ("pensumCourseId")
);

-- CreateTable
CREATE TABLE "PensumCoursePrerequisite" (
    "pensumCourseId" INTEGER NOT NULL,
    "prerequisiteId" INTEGER NOT NULL,

    CONSTRAINT "PensumCoursePrerequisite_pkey" PRIMARY KEY ("pensumCourseId","prerequisiteId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Career_name_key" ON "Career"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Course_name_key" ON "Course"("name");

-- CreateIndex
CREATE UNIQUE INDEX "StudyArea_name_key" ON "StudyArea"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Pensum_name_key" ON "Pensum"("name");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pensum" ADD CONSTRAINT "Pensum_pensumId_fkey" FOREIGN KEY ("pensumId") REFERENCES "Career"("careerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PensumCourse" ADD CONSTRAINT "PensumCourse_pensumId_fkey" FOREIGN KEY ("pensumId") REFERENCES "Pensum"("pensumId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PensumCourse" ADD CONSTRAINT "PensumCourse_courseCode_fkey" FOREIGN KEY ("courseCode") REFERENCES "Course"("courseCode") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PensumCourse" ADD CONSTRAINT "PensumCourse_studyAreaId_fkey" FOREIGN KEY ("studyAreaId") REFERENCES "StudyArea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PensumCoursePrerequisite" ADD CONSTRAINT "PensumCoursePrerequisite_pensumCourseId_fkey" FOREIGN KEY ("pensumCourseId") REFERENCES "PensumCourse"("pensumCourseId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PensumCoursePrerequisite" ADD CONSTRAINT "PensumCoursePrerequisite_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "PensumCourse"("pensumCourseId") ON DELETE RESTRICT ON UPDATE CASCADE;
