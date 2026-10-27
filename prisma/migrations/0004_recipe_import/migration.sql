-- CreateEnum
CREATE TYPE "ImportStatus" AS ENUM ('PENDING', 'SUCCESS', 'NO_RECIPE', 'FAILED');

-- CreateTable
CREATE TABLE "RecipeImport" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "status" "ImportStatus" NOT NULL DEFAULT 'PENDING',
    "imageCount" INTEGER NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecipeImport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecipeImport_memberId_day_idx" ON "RecipeImport"("memberId", "day");

-- AddForeignKey
ALTER TABLE "RecipeImport" ADD CONSTRAINT "RecipeImport_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
