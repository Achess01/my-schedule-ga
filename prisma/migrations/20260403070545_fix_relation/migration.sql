/*
  Warnings:

  - Added the required column `careerId` to the `Pensum` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Pensum" DROP CONSTRAINT "Pensum_pensumId_fkey";

-- AlterTable
ALTER TABLE "Pensum" ADD COLUMN     "careerId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Pensum" ADD CONSTRAINT "Pensum_careerId_fkey" FOREIGN KEY ("careerId") REFERENCES "Career"("careerId") ON DELETE RESTRICT ON UPDATE CASCADE;
