-- CreateTable
CREATE TABLE "registry_recognitions" (
    "id" TEXT NOT NULL,
    "authorityId" TEXT NOT NULL,
    "entityId" VARCHAR(500) NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "resource" VARCHAR(500) NOT NULL,
    "recognized" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registry_recognitions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "registry_recognitions_authorityId_idx" ON "registry_recognitions"("authorityId");

-- CreateIndex
CREATE INDEX "registry_recognitions_entityId_idx" ON "registry_recognitions"("entityId");

-- CreateIndex
CREATE INDEX "registry_recognitions_action_idx" ON "registry_recognitions"("action");

-- CreateIndex
CREATE INDEX "registry_recognitions_recognized_idx" ON "registry_recognitions"("recognized");

-- CreateIndex
CREATE UNIQUE INDEX "registry_recognitions_authorityId_entityId_action_resource_key" ON "registry_recognitions"("authorityId", "entityId", "action", "resource");

-- AddForeignKey
ALTER TABLE "registry_recognitions" ADD CONSTRAINT "registry_recognitions_authorityId_fkey" FOREIGN KEY ("authorityId") REFERENCES "trust_registries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
