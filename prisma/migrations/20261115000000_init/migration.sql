CREATE TABLE "Project" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Website" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "baseUrl" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Website_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "TestScenario" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "preconditions" JSONB NOT NULL,
  "steps" JSONB NOT NULL,
  "expectedResults" JSONB NOT NULL,
  "actions" JSONB NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TestScenario_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "TestRun" (
  "id" TEXT NOT NULL,
  "websiteId" TEXT NOT NULL,
  "scenarioId" TEXT,
  "status" TEXT NOT NULL,
  "title" TEXT,
  "finalUrl" TEXT,
  "httpStatus" INTEGER,
  "durationMs" INTEGER,
  "consoleErrors" JSONB,
  "pageErrors" JSONB,
  "failureMessage" TEXT,
  "screenshotUrl" TEXT,
  "completedSteps" INTEGER,
  "totalSteps" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TestRun_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Website_projectId_idx" ON "Website"("projectId");
CREATE INDEX "TestScenario_projectId_createdAt_idx" ON "TestScenario"("projectId","createdAt");
CREATE INDEX "TestRun_websiteId_createdAt_idx" ON "TestRun"("websiteId","createdAt");
ALTER TABLE "Website" ADD CONSTRAINT "Website_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TestScenario" ADD CONSTRAINT "TestScenario_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TestRun" ADD CONSTRAINT "TestRun_websiteId_fkey" FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TestRun" ADD CONSTRAINT "TestRun_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "TestScenario"("id") ON DELETE SET NULL ON UPDATE CASCADE;