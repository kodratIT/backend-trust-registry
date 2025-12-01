-- DropForeignKey
ALTER TABLE "registry_entries" DROP CONSTRAINT "registry_entries_issuer_fkey";

-- DropForeignKey
ALTER TABLE "registry_entries" DROP CONSTRAINT "registry_entries_verifier_fkey";

-- DropForeignKey
ALTER TABLE "status_history" DROP CONSTRAINT "status_history_issuer_fkey";

-- DropForeignKey
ALTER TABLE "status_history" DROP CONSTRAINT "status_history_verifier_fkey";

-- AlterTable
ALTER TABLE "registry_entries" ADD COLUMN     "issuerId" TEXT,
ADD COLUMN     "verifierId" TEXT;

-- AlterTable
ALTER TABLE "status_history" ADD COLUMN     "issuerId" TEXT,
ADD COLUMN     "verifierId" TEXT;

-- CreateIndex
CREATE INDEX "registry_entries_issuerId_idx" ON "registry_entries"("issuerId");

-- CreateIndex
CREATE INDEX "registry_entries_verifierId_idx" ON "registry_entries"("verifierId");

-- CreateIndex
CREATE INDEX "status_history_issuerId_idx" ON "status_history"("issuerId");

-- CreateIndex
CREATE INDEX "status_history_verifierId_idx" ON "status_history"("verifierId");

-- AddForeignKey
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "issuers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "verifiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registry_entries" ADD CONSTRAINT "registry_entries_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "issuers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registry_entries" ADD CONSTRAINT "registry_entries_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "verifiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
