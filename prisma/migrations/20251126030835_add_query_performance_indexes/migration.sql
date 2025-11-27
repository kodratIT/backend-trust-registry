-- CreateIndex
CREATE INDEX "credential_schemas_registryId_type_idx" ON "credential_schemas"("registryId", "type");

-- CreateIndex
CREATE INDEX "credential_schemas_trustFrameworkId_idx" ON "credential_schemas"("trustFrameworkId");

-- CreateIndex
CREATE INDEX "issuers_status_validFrom_validUntil_idx" ON "issuers"("status", "validFrom", "validUntil");

-- CreateIndex
CREATE INDEX "issuers_registryId_status_validFrom_validUntil_idx" ON "issuers"("registryId", "status", "validFrom", "validUntil");

-- CreateIndex
CREATE INDEX "issuers_trustFrameworkId_status_idx" ON "issuers"("trustFrameworkId", "status");

-- CreateIndex
CREATE INDEX "issuers_accreditationLevel_status_idx" ON "issuers"("accreditationLevel", "status");

-- CreateIndex
CREATE INDEX "issuers_createdAt_idx" ON "issuers"("createdAt");

-- CreateIndex
CREATE INDEX "verifiers_status_validFrom_validUntil_idx" ON "verifiers"("status", "validFrom", "validUntil");

-- CreateIndex
CREATE INDEX "verifiers_registryId_status_validFrom_validUntil_idx" ON "verifiers"("registryId", "status", "validFrom", "validUntil");

-- CreateIndex
CREATE INDEX "verifiers_trustFrameworkId_status_idx" ON "verifiers"("trustFrameworkId", "status");

-- CreateIndex
CREATE INDEX "verifiers_accreditationLevel_status_idx" ON "verifiers"("accreditationLevel", "status");

-- CreateIndex
CREATE INDEX "verifiers_createdAt_idx" ON "verifiers"("createdAt");
