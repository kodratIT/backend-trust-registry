-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateTable
CREATE TABLE "trust_frameworks" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "version" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "governanceFrameworkUrl" VARCHAR(500),
    "legalAgreements" JSONB,
    "jurisdictions" JSONB,
    "contexts" JSONB,
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trust_frameworks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trust_registries" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "trustFrameworkId" TEXT,
    "ecosystemDid" VARCHAR(500) NOT NULL,
    "governanceAuthority" VARCHAR(500),
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trust_registries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credential_schemas" (
    "id" TEXT NOT NULL,
    "registryId" TEXT NOT NULL,
    "trustFrameworkId" TEXT,
    "name" VARCHAR(255) NOT NULL,
    "version" VARCHAR(50) NOT NULL,
    "type" VARCHAR(500) NOT NULL,
    "jsonSchema" JSONB NOT NULL,
    "contexts" JSONB,
    "jurisdictions" JSONB,
    "issuerMode" VARCHAR(50) NOT NULL,
    "verifierMode" VARCHAR(50) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credential_schemas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issuers" (
    "id" TEXT NOT NULL,
    "did" VARCHAR(500) NOT NULL,
    "name" VARCHAR(255),
    "registryId" TEXT NOT NULL,
    "trustFrameworkId" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "statusDetails" JSONB,
    "jurisdictions" JSONB,
    "contexts" JSONB,
    "accreditationLevel" VARCHAR(50),
    "accreditationDetails" JSONB,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "endpoint" VARCHAR(500),
    "metadata" JSONB,
    "lifecycle" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "issuers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "issuer_credential_types" (
    "issuerId" TEXT NOT NULL,
    "schemaId" TEXT NOT NULL,

    CONSTRAINT "issuer_credential_types_pkey" PRIMARY KEY ("issuerId","schemaId")
);

-- CreateTable
CREATE TABLE "issuer_delegations" (
    "id" TEXT NOT NULL,
    "rootIssuerDid" VARCHAR(500) NOT NULL,
    "delegateIssuerDid" VARCHAR(500) NOT NULL,
    "scope" JSONB NOT NULL,
    "delegationProof" JSONB NOT NULL,
    "delegatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "issuer_delegations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifiers" (
    "id" TEXT NOT NULL,
    "did" VARCHAR(500) NOT NULL,
    "name" VARCHAR(255),
    "registryId" TEXT NOT NULL,
    "trustFrameworkId" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "statusDetails" JSONB,
    "jurisdictions" JSONB,
    "contexts" JSONB,
    "accreditationLevel" VARCHAR(50),
    "accreditationDetails" JSONB,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "endpoint" VARCHAR(500),
    "metadata" JSONB,
    "lifecycle" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifier_credential_types" (
    "verifierId" TEXT NOT NULL,
    "schemaId" TEXT NOT NULL,

    CONSTRAINT "verifier_credential_types_pkey" PRIMARY KEY ("verifierId","schemaId")
);

-- CreateTable
CREATE TABLE "status_history" (
    "id" TEXT NOT NULL,
    "entityType" VARCHAR(50) NOT NULL,
    "entityId" TEXT NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "previousStatus" VARCHAR(50),
    "reason" TEXT,
    "changedBy" VARCHAR(500),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registry_entries" (
    "id" TEXT NOT NULL,
    "entryType" VARCHAR(50) NOT NULL,
    "entityId" TEXT NOT NULL,
    "entryData" JSONB NOT NULL,
    "proof" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registry_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "federation_connections" (
    "id" TEXT NOT NULL,
    "localRegistryId" TEXT NOT NULL,
    "remoteRegistryId" VARCHAR(255) NOT NULL,
    "remoteRegistryName" VARCHAR(255) NOT NULL,
    "remoteRegistryEndpoint" VARCHAR(500) NOT NULL,
    "remoteRegistryType" VARCHAR(50) NOT NULL,
    "trustLevel" VARCHAR(50) NOT NULL,
    "federationAgreementUrl" VARCHAR(500),
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "federation_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "did_directory" (
    "id" TEXT NOT NULL,
    "did" VARCHAR(500) NOT NULL,
    "serviceType" VARCHAR(100),
    "endpoint" VARCHAR(500),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "did_directory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor" VARCHAR(500),
    "action" VARCHAR(100) NOT NULL,
    "resourceType" VARCHAR(100) NOT NULL,
    "resourceId" TEXT,
    "details" JSONB,
    "result" VARCHAR(50) NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "keyHash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "registryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trust_frameworks_status_idx" ON "trust_frameworks"("status");

-- CreateIndex
CREATE INDEX "trust_registries_status_idx" ON "trust_registries"("status");

-- CreateIndex
CREATE INDEX "trust_registries_ecosystemDid_idx" ON "trust_registries"("ecosystemDid");

-- CreateIndex
CREATE INDEX "credential_schemas_registryId_idx" ON "credential_schemas"("registryId");

-- CreateIndex
CREATE INDEX "credential_schemas_type_idx" ON "credential_schemas"("type");

-- CreateIndex
CREATE UNIQUE INDEX "issuers_did_key" ON "issuers"("did");

-- CreateIndex
CREATE INDEX "issuers_did_idx" ON "issuers"("did");

-- CreateIndex
CREATE INDEX "issuers_registryId_idx" ON "issuers"("registryId");

-- CreateIndex
CREATE INDEX "issuers_status_idx" ON "issuers"("status");

-- CreateIndex
CREATE INDEX "issuers_registryId_status_idx" ON "issuers"("registryId", "status");

-- CreateIndex
CREATE INDEX "issuer_delegations_rootIssuerDid_idx" ON "issuer_delegations"("rootIssuerDid");

-- CreateIndex
CREATE INDEX "issuer_delegations_delegateIssuerDid_idx" ON "issuer_delegations"("delegateIssuerDid");

-- CreateIndex
CREATE INDEX "issuer_delegations_status_idx" ON "issuer_delegations"("status");

-- CreateIndex
CREATE UNIQUE INDEX "verifiers_did_key" ON "verifiers"("did");

-- CreateIndex
CREATE INDEX "verifiers_did_idx" ON "verifiers"("did");

-- CreateIndex
CREATE INDEX "verifiers_registryId_idx" ON "verifiers"("registryId");

-- CreateIndex
CREATE INDEX "verifiers_status_idx" ON "verifiers"("status");

-- CreateIndex
CREATE INDEX "verifiers_registryId_status_idx" ON "verifiers"("registryId", "status");

-- CreateIndex
CREATE INDEX "status_history_entityType_entityId_idx" ON "status_history"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "status_history_timestamp_idx" ON "status_history"("timestamp");

-- CreateIndex
CREATE INDEX "registry_entries_entryType_entityId_idx" ON "registry_entries"("entryType", "entityId");

-- CreateIndex
CREATE INDEX "federation_connections_localRegistryId_idx" ON "federation_connections"("localRegistryId");

-- CreateIndex
CREATE INDEX "federation_connections_status_idx" ON "federation_connections"("status");

-- CreateIndex
CREATE UNIQUE INDEX "did_directory_did_key" ON "did_directory"("did");

-- CreateIndex
CREATE INDEX "did_directory_did_idx" ON "did_directory"("did");

-- CreateIndex
CREATE INDEX "did_directory_serviceType_idx" ON "did_directory"("serviceType");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs"("actor");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_resourceType_idx" ON "audit_logs"("resourceType");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_keyHash_idx" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_role_idx" ON "api_keys"("role");

-- AddForeignKey
ALTER TABLE "trust_registries" ADD CONSTRAINT "trust_registries_trustFrameworkId_fkey" FOREIGN KEY ("trustFrameworkId") REFERENCES "trust_frameworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credential_schemas" ADD CONSTRAINT "credential_schemas_registryId_fkey" FOREIGN KEY ("registryId") REFERENCES "trust_registries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credential_schemas" ADD CONSTRAINT "credential_schemas_trustFrameworkId_fkey" FOREIGN KEY ("trustFrameworkId") REFERENCES "trust_frameworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issuers" ADD CONSTRAINT "issuers_registryId_fkey" FOREIGN KEY ("registryId") REFERENCES "trust_registries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issuers" ADD CONSTRAINT "issuers_trustFrameworkId_fkey" FOREIGN KEY ("trustFrameworkId") REFERENCES "trust_frameworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issuer_credential_types" ADD CONSTRAINT "issuer_credential_types_issuerId_fkey" FOREIGN KEY ("issuerId") REFERENCES "issuers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issuer_credential_types" ADD CONSTRAINT "issuer_credential_types_schemaId_fkey" FOREIGN KEY ("schemaId") REFERENCES "credential_schemas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issuer_delegations" ADD CONSTRAINT "issuer_delegations_rootIssuerDid_fkey" FOREIGN KEY ("rootIssuerDid") REFERENCES "issuers"("did") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "issuer_delegations" ADD CONSTRAINT "issuer_delegations_delegateIssuerDid_fkey" FOREIGN KEY ("delegateIssuerDid") REFERENCES "issuers"("did") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifiers" ADD CONSTRAINT "verifiers_registryId_fkey" FOREIGN KEY ("registryId") REFERENCES "trust_registries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifiers" ADD CONSTRAINT "verifiers_trustFrameworkId_fkey" FOREIGN KEY ("trustFrameworkId") REFERENCES "trust_frameworks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifier_credential_types" ADD CONSTRAINT "verifier_credential_types_verifierId_fkey" FOREIGN KEY ("verifierId") REFERENCES "verifiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verifier_credential_types" ADD CONSTRAINT "verifier_credential_types_schemaId_fkey" FOREIGN KEY ("schemaId") REFERENCES "credential_schemas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_issuer_fkey" FOREIGN KEY ("entityId") REFERENCES "issuers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_history" ADD CONSTRAINT "status_history_verifier_fkey" FOREIGN KEY ("entityId") REFERENCES "verifiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registry_entries" ADD CONSTRAINT "registry_entries_issuer_fkey" FOREIGN KEY ("entityId") REFERENCES "issuers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registry_entries" ADD CONSTRAINT "registry_entries_verifier_fkey" FOREIGN KEY ("entityId") REFERENCES "verifiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "federation_connections" ADD CONSTRAINT "federation_connections_localRegistryId_fkey" FOREIGN KEY ("localRegistryId") REFERENCES "trust_registries"("id") ON DELETE CASCADE ON UPDATE CASCADE;
