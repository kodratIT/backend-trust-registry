/**
 * Database Seed Script
 * ToIP Trust Registry v2 Backend
 *
 * This script populates the database with initial test data for development.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import { PrismaClient } from '@prisma/client';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Generate a random API key
 */
function generateApiKey(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Hash an API key using bcrypt
 */
async function hashApiKey(key: string): Promise<string> {
  return bcrypt.hash(key, 12);
}

/**
 * Main seed function
 */
async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clean existing data (in development only)
  console.log('🧹 Cleaning existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.aPIKey.deleteMany();
  await prisma.federationConnection.deleteMany();
  await prisma.registryEntry.deleteMany();
  await prisma.statusHistory.deleteMany();
  await prisma.issuerDelegation.deleteMany();
  await prisma.issuerCredentialType.deleteMany();
  await prisma.verifierCredentialType.deleteMany();
  await prisma.issuer.deleteMany();
  await prisma.verifier.deleteMany();
  await prisma.credentialSchema.deleteMany();
  await prisma.trustRegistry.deleteMany();
  await prisma.trustFramework.deleteMany();
  await prisma.dIDDirectory.deleteMany();
  console.log('✅ Existing data cleaned\n');

  console.log(
    'ℹ️  Skipping migration data creation (Trust Frameworks, Registries, etc.) to ensure a clean state.\n'
  );

  /* DATA MIGRATION DISABLED
  // ============================================
  // TRUST FRAMEWORKS
  // ============================================
  console.log('📋 Creating Trust Frameworks...');
  
  // North America
  const frameworkCanada = await prisma.trustFramework.create({
    data: {
      name: 'Pan-Canadian Trust Framework',
      version: '1.4',
      description: 'A trust framework for digital identity in Canada',
      governanceFrameworkUrl: 'https://diacc.ca/trust-framework/',
      legalAgreements: ['https://diacc.ca/legal/terms'],
      jurisdictions: ['CA'],
      contexts: ['https://www.w3.org/2018/credentials/v1'],
      status: 'active',
    },
  });

  const frameworkUSA = await prisma.trustFramework.create({
    data: {
      name: 'US Digital Identity Framework',
      version: '2.0',
      description: 'United States digital identity trust framework',
      governanceFrameworkUrl: 'https://www.nist.gov/digital-identity',
      legalAgreements: ['https://www.nist.gov/legal/terms'],
      jurisdictions: ['US'],
      contexts: ['https://www.w3.org/2018/credentials/v1'],
      status: 'active',
    },
  });

  // Europe
  const frameworkEU = await prisma.trustFramework.create({
    data: {
      name: 'European Digital Identity Framework',
      version: '2.0',
      description: 'EU Digital Identity Wallet framework (eIDAS 2.0)',
      governanceFrameworkUrl: 'https://ec.europa.eu/digital-identity',
      legalAgreements: ['https://ec.europa.eu/legal/terms'],
      jurisdictions: ['EU', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'SE', 'NO', 'FI'],
      contexts: ['https://www.w3.org/2018/credentials/v1'],
      status: 'active',
    },
  });

  const frameworkUK = await prisma.trustFramework.create({
    data: {
      name: 'UK Digital Identity Framework',
      version: '1.0',
      description: 'United Kingdom digital identity and attributes trust framework',
      governanceFrameworkUrl: 'https://www.gov.uk/digital-identity',
      legalAgreements: ['https://www.gov.uk/legal/terms'],
      jurisdictions: ['GB'],
      contexts: ['https://www.w3.org/2018/credentials/v1'],
      status: 'active',
    },
  });

  // Asia Pacific
  const frameworkASEAN = await prisma.trustFramework.create({
    data: {
      name: 'ASEAN Digital Identity Framework',
      version: '1.0',
      description: 'Association of Southeast Asian Nations digital identity framework',
      governanceFrameworkUrl: 'https://asean.org/digital-identity',
      legalAgreements: ['https://asean.org/legal/terms'],
      jurisdictions: ['SG', 'ID', 'MY', 'TH', 'PH', 'VN'],
      contexts: ['https://www.w3.org/2018/credentials/v1'],
      status: 'active',
    },
  });

  const frameworkAustralia = await prisma.trustFramework.create({
    data: {
      name: 'Australian Trusted Digital Identity Framework',
      version: '1.0',
      description: 'Australian government digital identity framework',
      governanceFrameworkUrl: 'https://www.digitalidentity.gov.au/framework',
      legalAgreements: ['https://www.digitalidentity.gov.au/legal/terms'],
      jurisdictions: ['AU'],
      contexts: ['https://www.w3.org/2018/credentials/v1'],
      status: 'active',
    },
  });

  const frameworkJapan = await prisma.trustFramework.create({
    data: {
      name: 'Japan Digital Identity Framework',
      version: '1.0',
      description: 'Japan digital identity trust framework',
      governanceFrameworkUrl: 'https://www.digital.go.jp/identity',
      legalAgreements: ['https://www.digital.go.jp/legal/terms'],
      jurisdictions: ['JP'],
      contexts: ['https://www.w3.org/2018/credentials/v1'],
      status: 'active',
    },
  });

  // Africa
  const frameworkAfrica = await prisma.trustFramework.create({
    data: {
      name: 'African Digital Identity Framework',
      version: '1.0',
      description: 'Pan-African digital identity trust framework',
      governanceFrameworkUrl: 'https://au.int/digital-identity',
      legalAgreements: ['https://au.int/legal/terms'],
      jurisdictions: ['ZA', 'KE', 'NG', 'EG', 'GH'],
      contexts: ['https://www.w3.org/2018/credentials/v1'],
      status: 'active',
    },
  });

  // Latin America
  const frameworkLatAm = await prisma.trustFramework.create({
    data: {
      name: 'Latin American Digital Identity Framework',
      version: '1.0',
      description: 'Regional digital identity framework for Latin America',
      governanceFrameworkUrl: 'https://www.oas.org/digital-identity',
      legalAgreements: ['https://www.oas.org/legal/terms'],
      jurisdictions: ['BR', 'MX', 'AR', 'CL', 'CO'],
      contexts: ['https://www.w3.org/2018/credentials/v1'],
      status: 'active',
    },
  });

  // International/Global
  const frameworkGlobal = await prisma.trustFramework.create({
    data: {
      name: 'Global Digital Identity Framework',
      version: '1.0',
      description: 'International digital identity interoperability framework',
      governanceFrameworkUrl: 'https://www.un.org/digital-identity',
      legalAgreements: ['https://www.un.org/legal/terms'],
      jurisdictions: ['GLOBAL'],
      contexts: ['https://www.w3.org/2018/credentials/v1'],
      status: 'active',
    },
  });

  console.log(`✅ Created ${10} trust frameworks\n`);

  // ============================================
  // TRUST REGISTRIES
  // ============================================
  console.log('🏛️  Creating Trust Registries...');

  // North America
  const registryCanada = await prisma.trustRegistry.create({
    data: {
      name: 'Canadian Digital Identity Registry',
      description: 'Official registry for Canadian digital identity credentials',
      trustFrameworkId: frameworkCanada.id,
      ecosystemDid: 'did:web:registry.diacc.ca',
      governanceAuthority: 'Digital ID & Authentication Council of Canada (DIACC)',
      status: 'active',
    },
  });

  const _registryUSA = await prisma.trustRegistry.create({
    data: {
      name: 'US Federal Digital Identity Registry',
      description: 'United States federal digital identity trust registry',
      trustFrameworkId: frameworkUSA.id,
      ecosystemDid: 'did:web:registry.login.gov',
      governanceAuthority: 'National Institute of Standards and Technology (NIST)',
      status: 'active',
    },
  });

  // Europe
  const registryEU = await prisma.trustRegistry.create({
    data: {
      name: 'EU Digital Identity Wallet Registry',
      description: 'European Union digital identity wallet registry (eIDAS 2.0)',
      trustFrameworkId: frameworkEU.id,
      ecosystemDid: 'did:web:registry.eudi.eu',
      governanceAuthority: 'European Commission',
      status: 'active',
    },
  });

  const _registryGermany = await prisma.trustRegistry.create({
    data: {
      name: 'German eID Registry',
      description: 'Federal Republic of Germany electronic identity registry',
      trustFrameworkId: frameworkEU.id,
      ecosystemDid: 'did:web:registry.eid.de',
      governanceAuthority: 'Bundesamt für Sicherheit in der Informationstechnik (BSI)',
      status: 'active',
    },
  });

  const _registryFrance = await prisma.trustRegistry.create({
    data: {
      name: 'France Identité Numérique Registry',
      description: 'French national digital identity registry',
      trustFrameworkId: frameworkEU.id,
      ecosystemDid: 'did:web:registry.france-identite.gouv.fr',
      governanceAuthority: 'Agence Nationale de la Sécurité des Systèmes d\'Information (ANSSI)',
      status: 'active',
    },
  });

  const _registryUK = await prisma.trustRegistry.create({
    data: {
      name: 'UK Digital Identity Registry',
      description: 'United Kingdom digital identity and attributes registry',
      trustFrameworkId: frameworkUK.id,
      ecosystemDid: 'did:web:registry.digital-identity.gov.uk',
      governanceAuthority: 'UK Government Digital Service (GDS)',
      status: 'active',
    },
  });

  const _registryNetherlands = await prisma.trustRegistry.create({
    data: {
      name: 'Netherlands DigiD Registry',
      description: 'Dutch digital identity registry',
      trustFrameworkId: frameworkEU.id,
      ecosystemDid: 'did:web:registry.digid.nl',
      governanceAuthority: 'Logius (Dutch Digital Government Service)',
      status: 'active',
    },
  });

  const _registrySweden = await prisma.trustRegistry.create({
    data: {
      name: 'Swedish BankID Registry',
      description: 'Swedish electronic identification registry',
      trustFrameworkId: frameworkEU.id,
      ecosystemDid: 'did:web:registry.bankid.se',
      governanceAuthority: 'Swedish eID Board',
      status: 'active',
    },
  });

  const _registryNorway = await prisma.trustRegistry.create({
    data: {
      name: 'Norway Digital Identity Registry',
      description: 'Norwegian digital identity registry (BankID Norge)',
      trustFrameworkId: frameworkEU.id,
      ecosystemDid: 'did:web:registry.bankid.no',
      governanceAuthority: 'Norwegian Digitalisation Agency',
      status: 'active',
    },
  });

  const _registryDenmark = await prisma.trustRegistry.create({
    data: {
      name: 'Denmark Digital Identity Registry',
      description: 'Danish digital identity registry (MitID)',
      trustFrameworkId: frameworkEU.id,
      ecosystemDid: 'did:web:registry.mitid.dk',
      governanceAuthority: 'Danish Agency for Digital Government',
      status: 'active',
    },
  });

  const _registryFinland = await prisma.trustRegistry.create({
    data: {
      name: 'Finland Digital Identity Registry',
      description: 'Finnish digital identity registry (Suomi.fi)',
      trustFrameworkId: frameworkEU.id,
      ecosystemDid: 'did:web:registry.suomi.fi',
      governanceAuthority: 'Digital and Population Data Services Agency',
      status: 'active',
    },
  });

  const _registryItaly = await prisma.trustRegistry.create({
    data: {
      name: 'Italy Digital Identity Registry',
      description: 'Italian digital identity registry (SPID)',
      trustFrameworkId: frameworkEU.id,
      ecosystemDid: 'did:web:registry.spid.gov.it',
      governanceAuthority: 'Agenzia per l\'Italia Digitale (AgID)',
      status: 'active',
    },
  });

  const _registrySpain = await prisma.trustRegistry.create({
    data: {
      name: 'Spain Digital Identity Registry',
      description: 'Spanish digital identity registry (Cl@ve)',
      trustFrameworkId: frameworkEU.id,
      ecosystemDid: 'did:web:registry.clave.gob.es',
      governanceAuthority: 'Ministerio de Asuntos Económicos y Transformación Digital',
      status: 'active',
    },
  });

  const _registryPoland = await prisma.trustRegistry.create({
    data: {
      name: 'Poland Digital Identity Registry',
      description: 'Polish digital identity registry (mObywatel)',
      trustFrameworkId: frameworkEU.id,
      ecosystemDid: 'did:web:registry.gov.pl',
      governanceAuthority: 'Ministry of Digital Affairs',
      status: 'active',
    },
  });

  // Asia Pacific
  const registryIndonesia = await prisma.trustRegistry.create({
    data: {
      name: 'Indonesia Digital Identity Registry',
      description: 'Indonesian national digital identity registry (Identitas Digital)',
      trustFrameworkId: frameworkASEAN.id,
      ecosystemDid: 'did:web:registry.digital.go.id',
      governanceAuthority: 'Kementerian Komunikasi dan Informatika (Kominfo)',
      status: 'active',
    },
  });

  const _registrySingapore = await prisma.trustRegistry.create({
    data: {
      name: 'Singapore National Digital Identity Registry',
      description: 'Singapore national digital identity trust registry (Singpass)',
      trustFrameworkId: frameworkASEAN.id,
      ecosystemDid: 'did:web:registry.ndi.gov.sg',
      governanceAuthority: 'Government Technology Agency of Singapore (GovTech)',
      status: 'active',
    },
  });

  const _registryMalaysia = await prisma.trustRegistry.create({
    data: {
      name: 'Malaysia Digital Identity Registry',
      description: 'Malaysian national digital identity registry (MyDigital ID)',
      trustFrameworkId: frameworkASEAN.id,
      ecosystemDid: 'did:web:registry.mydigitalid.my',
      governanceAuthority: 'Malaysian Communications and Multimedia Commission (MCMC)',
      status: 'active',
    },
  });

  const _registryThailand = await prisma.trustRegistry.create({
    data: {
      name: 'Thailand Digital Identity Registry',
      description: 'Thai national digital identity registry (Thai Digital ID)',
      trustFrameworkId: frameworkASEAN.id,
      ecosystemDid: 'did:web:registry.digitalid.go.th',
      governanceAuthority: 'Digital Government Development Agency (DGA)',
      status: 'active',
    },
  });

  const _registryPhilippines = await prisma.trustRegistry.create({
    data: {
      name: 'Philippines Digital Identity Registry',
      description: 'Philippine national digital identity registry (PhilSys)',
      trustFrameworkId: frameworkASEAN.id,
      ecosystemDid: 'did:web:registry.philsys.gov.ph',
      governanceAuthority: 'Philippine Statistics Authority (PSA)',
      status: 'active',
    },
  });

  const _registryVietnam = await prisma.trustRegistry.create({
    data: {
      name: 'Vietnam Digital Identity Registry',
      description: 'Vietnamese national digital identity registry (VNeID)',
      trustFrameworkId: frameworkASEAN.id,
      ecosystemDid: 'did:web:registry.vneid.gov.vn',
      governanceAuthority: 'Ministry of Public Security of Vietnam',
      status: 'active',
    },
  });

  const _registryAustralia = await prisma.trustRegistry.create({
    data: {
      name: 'Australian Digital Identity Registry',
      description: 'Australian government digital identity registry (myGovID)',
      trustFrameworkId: frameworkAustralia.id,
      ecosystemDid: 'did:web:registry.digitalidentity.gov.au',
      governanceAuthority: 'Australian Taxation Office (ATO)',
      status: 'active',
    },
  });

  const _registryNewZealand = await prisma.trustRegistry.create({
    data: {
      name: 'New Zealand Digital Identity Registry',
      description: 'New Zealand digital identity trust registry (RealMe)',
      trustFrameworkId: frameworkGlobal.id,
      ecosystemDid: 'did:web:registry.realme.govt.nz',
      governanceAuthority: 'Department of Internal Affairs (DIA)',
      status: 'active',
    },
  });

  const _registryJapan = await prisma.trustRegistry.create({
    data: {
      name: 'Japan Digital Identity Registry',
      description: 'Japanese digital identity trust registry (My Number)',
      trustFrameworkId: frameworkJapan.id,
      ecosystemDid: 'did:web:registry.digital.go.jp',
      governanceAuthority: 'Digital Agency of Japan',
      status: 'active',
    },
  });

  const _registryIndia = await prisma.trustRegistry.create({
    data: {
      name: 'India Digital Identity Registry',
      description: 'Indian digital identity registry (Aadhaar ecosystem)',
      trustFrameworkId: frameworkGlobal.id,
      ecosystemDid: 'did:web:registry.uidai.gov.in',
      governanceAuthority: 'Unique Identification Authority of India (UIDAI)',
      status: 'active',
    },
  });

  const _registryKorea = await prisma.trustRegistry.create({
    data: {
      name: 'South Korea Digital Identity Registry',
      description: 'Republic of Korea digital identity registry',
      trustFrameworkId: frameworkGlobal.id,
      ecosystemDid: 'did:web:registry.mois.go.kr',
      governanceAuthority: 'Ministry of the Interior and Safety (MOIS)',
      status: 'active',
    },
  });

  const _registryChina = await prisma.trustRegistry.create({
    data: {
      name: 'China Digital Identity Registry',
      description: 'People\'s Republic of China digital identity registry',
      trustFrameworkId: frameworkGlobal.id,
      ecosystemDid: 'did:web:registry.gov.cn',
      governanceAuthority: 'Cyberspace Administration of China (CAC)',
      status: 'active',
    },
  });

  const _registryTaiwan = await prisma.trustRegistry.create({
    data: {
      name: 'Taiwan Digital Identity Registry',
      description: 'Taiwan digital identity registry',
      trustFrameworkId: frameworkGlobal.id,
      ecosystemDid: 'did:web:registry.gov.tw',
      governanceAuthority: 'National Development Council (NDC)',
      status: 'active',
    },
  });

  // Africa
  const _registrySouthAfrica = await prisma.trustRegistry.create({
    data: {
      name: 'South African Digital Identity Registry',
      description: 'South African national digital identity registry',
      trustFrameworkId: frameworkAfrica.id,
      ecosystemDid: 'did:web:registry.dha.gov.za',
      governanceAuthority: 'Department of Home Affairs (DHA)',
      status: 'active',
    },
  });

  const _registryKenya = await prisma.trustRegistry.create({
    data: {
      name: 'Kenya Digital Identity Registry',
      description: 'Kenyan national digital identity registry (Huduma Namba)',
      trustFrameworkId: frameworkAfrica.id,
      ecosystemDid: 'did:web:registry.hudumanamba.go.ke',
      governanceAuthority: 'National Integrated Identity Management System (NIIMS)',
      status: 'active',
    },
  });

  const _registryNigeria = await prisma.trustRegistry.create({
    data: {
      name: 'Nigeria Digital Identity Registry',
      description: 'Nigerian national identity management registry',
      trustFrameworkId: frameworkAfrica.id,
      ecosystemDid: 'did:web:registry.nimc.gov.ng',
      governanceAuthority: 'National Identity Management Commission (NIMC)',
      status: 'active',
    },
  });

  const _registryEgypt = await prisma.trustRegistry.create({
    data: {
      name: 'Egypt Digital Identity Registry',
      description: 'Egyptian national digital identity registry',
      trustFrameworkId: frameworkAfrica.id,
      ecosystemDid: 'did:web:registry.egypt.gov.eg',
      governanceAuthority: 'Ministry of Communications and Information Technology',
      status: 'active',
    },
  });

  const _registryGhana = await prisma.trustRegistry.create({
    data: {
      name: 'Ghana Digital Identity Registry',
      description: 'Ghanaian national digital identity registry (Ghana Card)',
      trustFrameworkId: frameworkAfrica.id,
      ecosystemDid: 'did:web:registry.nia.gov.gh',
      governanceAuthority: 'National Identification Authority (NIA)',
      status: 'active',
    },
  });

  const _registryMorocco = await prisma.trustRegistry.create({
    data: {
      name: 'Morocco Digital Identity Registry',
      description: 'Moroccan national digital identity registry',
      trustFrameworkId: frameworkAfrica.id,
      ecosystemDid: 'did:web:registry.gov.ma',
      governanceAuthority: 'Agence de Développement du Digital',
      status: 'active',
    },
  });

  // Latin America
  const _registryBrazil = await prisma.trustRegistry.create({
    data: {
      name: 'Brazil Digital Identity Registry',
      description: 'Brazilian national digital identity registry (gov.br)',
      trustFrameworkId: frameworkLatAm.id,
      ecosystemDid: 'did:web:registry.gov.br',
      governanceAuthority: 'Ministério da Gestão e da Inovação em Serviços Públicos',
      status: 'active',
    },
  });

  const _registryMexico = await prisma.trustRegistry.create({
    data: {
      name: 'Mexico Digital Identity Registry',
      description: 'Mexican national digital identity registry',
      trustFrameworkId: frameworkLatAm.id,
      ecosystemDid: 'did:web:registry.gob.mx',
      governanceAuthority: 'Secretaría de Gobernación (SEGOB)',
      status: 'active',
    },
  });

  const _registryArgentina = await prisma.trustRegistry.create({
    data: {
      name: 'Argentina Digital Identity Registry',
      description: 'Argentine national digital identity registry (Mi Argentina)',
      trustFrameworkId: frameworkLatAm.id,
      ecosystemDid: 'did:web:registry.argentina.gob.ar',
      governanceAuthority: 'Ministerio del Interior',
      status: 'active',
    },
  });

  const _registryChile = await prisma.trustRegistry.create({
    data: {
      name: 'Chile Digital Identity Registry',
      description: 'Chilean national digital identity registry (ClaveÚnica)',
      trustFrameworkId: frameworkLatAm.id,
      ecosystemDid: 'did:web:registry.claveunica.gob.cl',
      governanceAuthority: 'Ministerio Secretaría General de la Presidencia',
      status: 'active',
    },
  });

  const _registryColombia = await prisma.trustRegistry.create({
    data: {
      name: 'Colombia Digital Identity Registry',
      description: 'Colombian national digital identity registry',
      trustFrameworkId: frameworkLatAm.id,
      ecosystemDid: 'did:web:registry.gov.co',
      governanceAuthority: 'Ministerio de Tecnologías de la Información y las Comunicaciones',
      status: 'active',
    },
  });

  const _registryPeru = await prisma.trustRegistry.create({
    data: {
      name: 'Peru Digital Identity Registry',
      description: 'Peruvian national digital identity registry',
      trustFrameworkId: frameworkLatAm.id,
      ecosystemDid: 'did:web:registry.gob.pe',
      governanceAuthority: 'Registro Nacional de Identificación y Estado Civil (RENIEC)',
      status: 'active',
    },
  });

  // Middle East
  const _registryUAE = await prisma.trustRegistry.create({
    data: {
      name: 'UAE Digital Identity Registry',
      description: 'United Arab Emirates digital identity registry (UAE Pass)',
      trustFrameworkId: frameworkGlobal.id,
      ecosystemDid: 'did:web:registry.uaepass.ae',
      governanceAuthority: 'Telecommunications and Digital Government Regulatory Authority (TDRA)',
      status: 'active',
    },
  });

  const _registrySaudiArabia = await prisma.trustRegistry.create({
    data: {
      name: 'Saudi Arabia Digital Identity Registry',
      description: 'Kingdom of Saudi Arabia digital identity registry (Absher)',
      trustFrameworkId: frameworkGlobal.id,
      ecosystemDid: 'did:web:registry.absher.sa',
      governanceAuthority: 'Ministry of Interior - Saudi Arabia',
      status: 'active',
    },
  });

  // International/Continental Organizations
  const registryGlobal = await prisma.trustRegistry.create({
    data: {
      name: 'Global Interoperability Registry',
      description: 'International digital identity interoperability registry',
      trustFrameworkId: frameworkGlobal.id,
      ecosystemDid: 'did:web:registry.global-identity.org',
      governanceAuthority: 'International Digital Identity Consortium',
      status: 'active',
    },
  });

  const registryEducation = await prisma.trustRegistry.create({
    data: {
      name: 'Global Education Credentials Registry',
      description: 'International registry for educational credentials and qualifications',
      trustFrameworkId: frameworkGlobal.id,
      ecosystemDid: 'did:web:registry.education.unesco.org',
      governanceAuthority: 'UNESCO',
      status: 'active',
    },
  });

  const registryHealthcare = await prisma.trustRegistry.create({
    data: {
      name: 'Global Healthcare Credentials Registry',
      description: 'International registry for healthcare professional credentials',
      trustFrameworkId: frameworkGlobal.id,
      ecosystemDid: 'did:web:registry.health.who.int',
      governanceAuthority: 'World Health Organization (WHO)',
      status: 'active',
    },
  });

  // Mark unused registries as intentionally unused (for future use)
  void _registryUSA; void _registryGermany; void _registryFrance; void _registryUK;
  void _registryNetherlands; void _registrySweden; void _registryNorway; void _registryDenmark;
  void _registryFinland; void _registryItaly; void _registrySpain; void _registryPoland;
  void _registrySingapore; void _registryMalaysia; void _registryThailand; void _registryPhilippines;
  void _registryVietnam; void _registryAustralia; void _registryNewZealand; void _registryJapan;
  void _registryIndia; void _registryKorea; void _registryChina; void _registryTaiwan;
  void _registrySouthAfrica; void _registryKenya; void _registryNigeria; void _registryEgypt;
  void _registryGhana; void _registryMorocco; void _registryBrazil; void _registryMexico;
  void _registryArgentina; void _registryChile; void _registryColombia; void _registryPeru;
  void _registryUAE; void _registrySaudiArabia;

  console.log(`✅ Created ${45} trust registries\n`);

  // ============================================
  // CREDENTIAL SCHEMAS
  // ============================================
  console.log('📜 Creating Credential Schemas...');

  // Identity Credentials
  const schemaPersonID = await prisma.credentialSchema.create({
    data: {
      registryId: registryCanada.id,
      trustFrameworkId: frameworkCanada.id,
      name: 'Verified Person Credential',
      version: '1.0',
      type: 'VerifiedPersonCredential',
      jsonSchema: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          givenName: { type: 'string' },
          familyName: { type: 'string' },
          birthDate: { type: 'string', format: 'date' },
          nationality: { type: 'string' },
        },
        required: ['givenName', 'familyName'],
      },
      contexts: ['https://www.w3.org/2018/credentials/v1'],
      jurisdictions: ['CA'],
      issuerMode: 'ECOSYSTEM',
      verifierMode: 'OPEN',
    },
  });

  const schemaEUID = await prisma.credentialSchema.create({
    data: {
      registryId: registryEU.id,
      trustFrameworkId: frameworkEU.id,
      name: 'EU Digital Identity Credential',
      version: '1.0',
      type: 'EUDigitalIdentityCredential',
      jsonSchema: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          dateOfBirth: { type: 'string', format: 'date' },
          nationality: { type: 'string' },
          idNumber: { type: 'string' },
        },
        required: ['firstName', 'lastName', 'dateOfBirth'],
      },
      contexts: ['https://www.w3.org/2018/credentials/v1'],
      jurisdictions: ['EU'],
      issuerMode: 'ECOSYSTEM',
      verifierMode: 'ECOSYSTEM',
    },
  });

  // Education Credentials
  const schemaUniversityDegree = await prisma.credentialSchema.create({
    data: {
      registryId: registryEducation.id,
      trustFrameworkId: frameworkGlobal.id,
      name: 'University Degree Credential',
      version: '1.0',
      type: 'UniversityDegreeCredential',
      jsonSchema: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          degree: { type: 'string' },
          major: { type: 'string' },
          university: { type: 'string' },
          graduationDate: { type: 'string', format: 'date' },
          gpa: { type: 'number' },
        },
        required: ['degree', 'major', 'university', 'graduationDate'],
      },
      contexts: ['https://www.w3.org/2018/credentials/v1'],
      jurisdictions: ['GLOBAL'],
      issuerMode: 'ECOSYSTEM',
      verifierMode: 'OPEN',
    },
  });

  // Professional Credentials
  const _schemaProfessionalLicense = await prisma.credentialSchema.create({
    data: {
      registryId: registryGlobal.id,
      trustFrameworkId: frameworkGlobal.id,
      name: 'Professional License Credential',
      version: '1.0',
      type: 'ProfessionalLicenseCredential',
      jsonSchema: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          licenseType: { type: 'string' },
          licenseNumber: { type: 'string' },
          issuingAuthority: { type: 'string' },
          issueDate: { type: 'string', format: 'date' },
          expiryDate: { type: 'string', format: 'date' },
        },
        required: ['licenseType', 'licenseNumber', 'issuingAuthority'],
      },
      contexts: ['https://www.w3.org/2018/credentials/v1'],
      jurisdictions: ['GLOBAL'],
      issuerMode: 'ECOSYSTEM',
      verifierMode: 'ECOSYSTEM',
    },
  });

  // Healthcare Credentials
  const _schemaMedicalLicense = await prisma.credentialSchema.create({
    data: {
      registryId: registryHealthcare.id,
      trustFrameworkId: frameworkGlobal.id,
      name: 'Medical License Credential',
      version: '1.0',
      type: 'MedicalLicenseCredential',
      jsonSchema: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          licenseNumber: { type: 'string' },
          specialty: { type: 'string' },
          issuingBoard: { type: 'string' },
          issueDate: { type: 'string', format: 'date' },
          expiryDate: { type: 'string', format: 'date' },
        },
        required: ['licenseNumber', 'specialty', 'issuingBoard'],
      },
      contexts: ['https://www.w3.org/2018/credentials/v1'],
      jurisdictions: ['GLOBAL'],
      issuerMode: 'ECOSYSTEM',
      verifierMode: 'ECOSYSTEM',
    },
  });

  // Travel Credentials
  const _schemaPassport = await prisma.credentialSchema.create({
    data: {
      registryId: registryGlobal.id,
      trustFrameworkId: frameworkGlobal.id,
      name: 'Digital Passport Credential',
      version: '1.0',
      type: 'DigitalPassportCredential',
      jsonSchema: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          passportNumber: { type: 'string' },
          nationality: { type: 'string' },
          issueDate: { type: 'string', format: 'date' },
          expiryDate: { type: 'string', format: 'date' },
          issuingCountry: { type: 'string' },
        },
        required: ['passportNumber', 'nationality', 'issuingCountry'],
      },
      contexts: ['https://www.w3.org/2018/credentials/v1'],
      jurisdictions: ['GLOBAL'],
      issuerMode: 'ECOSYSTEM',
      verifierMode: 'ECOSYSTEM',
    },
  });

  // Financial Credentials
  const _schemaKYC = await prisma.credentialSchema.create({
    data: {
      registryId: registryGlobal.id,
      trustFrameworkId: frameworkGlobal.id,
      name: 'KYC Verification Credential',
      version: '1.0',
      type: 'KYCVerificationCredential',
      jsonSchema: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          verificationLevel: { type: 'string' },
          verifiedBy: { type: 'string' },
          verificationDate: { type: 'string', format: 'date' },
          expiryDate: { type: 'string', format: 'date' },
        },
        required: ['verificationLevel', 'verifiedBy', 'verificationDate'],
      },
      contexts: ['https://www.w3.org/2018/credentials/v1'],
      jurisdictions: ['GLOBAL'],
      issuerMode: 'ECOSYSTEM',
      verifierMode: 'ECOSYSTEM',
    },
  });

  // Employment Credentials
  const schemaEmployment = await prisma.credentialSchema.create({
    data: {
      registryId: registryGlobal.id,
      trustFrameworkId: frameworkGlobal.id,
      name: 'Employment Verification Credential',
      version: '1.0',
      type: 'EmploymentVerificationCredential',
      jsonSchema: {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        properties: {
          employer: { type: 'string' },
          position: { type: 'string' },
          startDate: { type: 'string', format: 'date' },
          endDate: { type: 'string', format: 'date' },
          employmentType: { type: 'string' },
        },
        required: ['employer', 'position', 'startDate'],
      },
      contexts: ['https://www.w3.org/2018/credentials/v1'],
      jurisdictions: ['GLOBAL'],
      issuerMode: 'OPEN',
      verifierMode: 'OPEN',
    },
  });

  // Mark unused schemas as intentionally unused (for future use)
  void _schemaProfessionalLicense;
  void _schemaMedicalLicense;
  void _schemaPassport;
  void _schemaKYC;

  console.log(`✅ Created ${8} credential schemas\n`);

  // ============================================
  // ISSUERS
  // ============================================
  console.log('🏢 Creating Issuers...');

  const issuerCanada = await prisma.issuer.create({
    data: {
      did: 'did:web:issuer.servicecanada.gc.ca',
      name: 'Service Canada',
      registryId: registryCanada.id,
      trustFrameworkId: frameworkCanada.id,
      status: 'active',
      jurisdictions: [{ code: 'CA', name: 'Canada' }],
      contexts: ['https://www.w3.org/2018/credentials/v1'],
      accreditationLevel: 'high',
      accreditationDetails: {
        accreditor: 'DIACC',
        date: '2024-01-01',
        expiryDate: '2025-12-31',
      },
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-12-31'),
      endpoint: 'https://issuer.servicecanada.gc.ca/credentials',
      metadata: {
        organizationType: 'government',
        contactEmail: 'digital-identity@servicecanada.gc.ca',
      },
    },
  });

  const issuerEU = await prisma.issuer.create({
    data: {
      did: 'did:web:issuer.eudi.eu',
      name: 'EU Digital Identity Issuer',
      registryId: registryEU.id,
      trustFrameworkId: frameworkEU.id,
      status: 'active',
      jurisdictions: [
        { code: 'EU', name: 'European Union' },
      ],
      contexts: ['https://www.w3.org/2018/credentials/v1'],
      accreditationLevel: 'high',
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-12-31'),
      endpoint: 'https://issuer.eudi.eu/credentials',
      metadata: {
        organizationType: 'government',
        contactEmail: 'support@eudi.eu',
      },
    },
  });

  const issuerUniversity = await prisma.issuer.create({
    data: {
      did: 'did:web:credentials.mit.edu',
      name: 'Massachusetts Institute of Technology',
      registryId: registryEducation.id,
      trustFrameworkId: frameworkGlobal.id,
      status: 'active',
      jurisdictions: [{ code: 'US', name: 'United States' }],
      contexts: ['https://www.w3.org/2018/credentials/v1'],
      accreditationLevel: 'high',
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-12-31'),
      endpoint: 'https://credentials.mit.edu/issue',
      metadata: {
        organizationType: 'education',
        contactEmail: 'registrar@mit.edu',
      },
    },
  });

  console.log(`✅ Created ${3} issuers\n`);

  // ============================================
  // ISSUER CREDENTIAL TYPES
  // ============================================
  console.log('🔗 Linking Issuers to Credential Schemas...');

  await prisma.issuerCredentialType.create({
    data: {
      issuerId: issuerCanada.id,
      schemaId: schemaPersonID.id,
    },
  });

  await prisma.issuerCredentialType.create({
    data: {
      issuerId: issuerEU.id,
      schemaId: schemaEUID.id,
    },
  });

  await prisma.issuerCredentialType.create({
    data: {
      issuerId: issuerUniversity.id,
      schemaId: schemaUniversityDegree.id,
    },
  });

  console.log(`✅ Created ${3} issuer-schema links\n`);

  // ============================================
  // VERIFIERS
  // ============================================
  console.log('🔍 Creating Verifiers...');

  const verifierCanada = await prisma.verifier.create({
    data: {
      did: 'did:web:verifier.cra-arc.gc.ca',
      name: 'Canada Revenue Agency',
      registryId: registryCanada.id,
      trustFrameworkId: frameworkCanada.id,
      status: 'active',
      jurisdictions: [{ code: 'CA', name: 'Canada' }],
      contexts: ['https://www.w3.org/2018/credentials/v1'],
      accreditationLevel: 'high',
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-12-31'),
      endpoint: 'https://verifier.cra-arc.gc.ca/verify',
      metadata: {
        organizationType: 'government',
        contactEmail: 'digital-services@cra-arc.gc.ca',
      },
    },
  });

  const verifierEmployer = await prisma.verifier.create({
    data: {
      did: 'did:web:hr.acme-corp.com',
      name: 'ACME Corporation HR',
      registryId: registryGlobal.id,
      trustFrameworkId: frameworkGlobal.id,
      status: 'active',
      jurisdictions: [{ code: 'GLOBAL', name: 'Global' }],
      contexts: ['https://www.w3.org/2018/credentials/v1'],
      accreditationLevel: 'medium',
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-12-31'),
      endpoint: 'https://hr.acme-corp.com/verify',
      metadata: {
        organizationType: 'private',
        contactEmail: 'hr@acme-corp.com',
      },
    },
  });

  console.log(`✅ Created ${2} verifiers\n`);

  // ============================================
  // VERIFIER CREDENTIAL TYPES
  // ============================================
  console.log('🔗 Linking Verifiers to Credential Schemas...');

  await prisma.verifierCredentialType.create({
    data: {
      verifierId: verifierCanada.id,
      schemaId: schemaPersonID.id,
    },
  });

  await prisma.verifierCredentialType.create({
    data: {
      verifierId: verifierEmployer.id,
      schemaId: schemaUniversityDegree.id,
    },
  });

  await prisma.verifierCredentialType.create({
    data: {
      verifierId: verifierEmployer.id,
      schemaId: schemaEmployment.id,
    },
  });

  console.log(`✅ Created ${3} verifier-schema links\n`);

  // ============================================
  // REGISTRY RECOGNITIONS (Inter-Registry Trust)
  // ============================================
  console.log('🤝 Creating Registry Recognitions...');

  // Global registry recognizes regional registries
  await prisma.registryRecognition.create({
    data: {
      authorityId: registryGlobal.id,
      entityId: registryEU.ecosystemDid,
      action: 'govern',
      resource: 'digital-identity',
      recognized: true,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-12-31'),
      metadata: {
        recognitionType: 'bilateral',
        trustLevel: 'high',
      },
    },
  });

  await prisma.registryRecognition.create({
    data: {
      authorityId: registryGlobal.id,
      entityId: registryCanada.ecosystemDid,
      action: 'govern',
      resource: 'digital-identity',
      recognized: true,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-12-31'),
      metadata: {
        recognitionType: 'bilateral',
        trustLevel: 'high',
      },
    },
  });

  await prisma.registryRecognition.create({
    data: {
      authorityId: registryGlobal.id,
      entityId: registryIndonesia.ecosystemDid,
      action: 'govern',
      resource: 'digital-identity',
      recognized: true,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-12-31'),
      metadata: {
        recognitionType: 'bilateral',
        trustLevel: 'high',
      },
    },
  });

  // EU recognizes member states
  await prisma.registryRecognition.create({
    data: {
      authorityId: registryEU.id,
      entityId: registryCanada.ecosystemDid,
      action: 'recognize',
      resource: 'identity-credentials',
      recognized: true,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-12-31'),
      metadata: {
        recognitionType: 'mutual',
        trustLevel: 'high',
        agreement: 'EU-Canada Digital Identity Agreement',
      },
    },
  });

  // Canada recognizes EU
  await prisma.registryRecognition.create({
    data: {
      authorityId: registryCanada.id,
      entityId: registryEU.ecosystemDid,
      action: 'recognize',
      resource: 'identity-credentials',
      recognized: true,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-12-31'),
      metadata: {
        recognitionType: 'mutual',
        trustLevel: 'high',
        agreement: 'EU-Canada Digital Identity Agreement',
      },
    },
  });

  // Indonesia recognizes ASEAN members
  await prisma.registryRecognition.create({
    data: {
      authorityId: registryIndonesia.id,
      entityId: registryCanada.ecosystemDid,
      action: 'recognize',
      resource: 'professional-credentials',
      recognized: true,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-12-31'),
      metadata: {
        recognitionType: 'unilateral',
        trustLevel: 'medium',
      },
    },
  });

  // Education registry recognizes all national registries
  await prisma.registryRecognition.create({
    data: {
      authorityId: registryEducation.id,
      entityId: registryIndonesia.ecosystemDid,
      action: 'recognize',
      resource: 'education-credentials',
      recognized: true,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-12-31'),
      metadata: {
        recognitionType: 'multilateral',
        trustLevel: 'high',
      },
    },
  });

  await prisma.registryRecognition.create({
    data: {
      authorityId: registryEducation.id,
      entityId: registryCanada.ecosystemDid,
      action: 'recognize',
      resource: 'education-credentials',
      recognized: true,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-12-31'),
      metadata: {
        recognitionType: 'multilateral',
        trustLevel: 'high',
      },
    },
  });

  await prisma.registryRecognition.create({
    data: {
      authorityId: registryEducation.id,
      entityId: registryEU.ecosystemDid,
      action: 'recognize',
      resource: 'education-credentials',
      recognized: true,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-12-31'),
      metadata: {
        recognitionType: 'multilateral',
        trustLevel: 'high',
      },
    },
  });

  // Healthcare registry recognizes national registries
  await prisma.registryRecognition.create({
    data: {
      authorityId: registryHealthcare.id,
      entityId: registryIndonesia.ecosystemDid,
      action: 'recognize',
      resource: 'healthcare-credentials',
      recognized: true,
      validFrom: new Date('2024-01-01'),
      validUntil: new Date('2025-12-31'),
      metadata: {
        recognitionType: 'multilateral',
        trustLevel: 'high',
      },
    },
  });

  console.log(`✅ Created ${10} registry recognitions\n`);
  */

  // ============================================
  // API KEYS
  // ============================================
  console.log('🔑 Creating API Keys...');

  // Admin API Key
  const adminKey = generateApiKey();
  const adminKeyHash = await hashApiKey(adminKey);

  await prisma.aPIKey.create({
    data: {
      keyHash: adminKeyHash,
      name: 'Admin API Key',
      role: 'admin',
      expiresAt: new Date('2026-12-31'),
    },
  });

  /*
  // Registry Owner API Key (Depends on registryCanada which is disabled)
  const registryKey = generateApiKey();
  const registryKeyHash = await hashApiKey(registryKey);
  
  await prisma.aPIKey.create({
    data: {
      keyHash: registryKeyHash,
      name: 'Registry Owner API Key',
      role: 'registry_owner',
      registryId: registryCanada.id,
      expiresAt: new Date('2025-12-31'),
    },
  });
  */

  // Public API Key
  const publicKey = generateApiKey();
  const publicKeyHash = await hashApiKey(publicKey);

  await prisma.aPIKey.create({
    data: {
      keyHash: publicKeyHash,
      name: 'Public API Key',
      role: 'public',
      expiresAt: new Date('2025-12-31'),
    },
  });

  console.log(`✅ Created ${2} API keys\n`);

  /*
  // ============================================
  // DID DIRECTORY
  // ============================================
  console.log('📇 Creating DID Directory Entries...');

  await prisma.dIDDirectory.create({
    data: {
      did: issuerCanada.did,
      serviceType: 'CredentialIssuer',
      endpoint: issuerCanada.endpoint,
      metadata: {
        name: issuerCanada.name,
        type: 'issuer',
        country: 'CA',
      },
    },
  });

  await prisma.dIDDirectory.create({
    data: {
      did: issuerEU.did,
      serviceType: 'CredentialIssuer',
      endpoint: issuerEU.endpoint,
      metadata: {
        name: issuerEU.name,
        type: 'issuer',
        region: 'EU',
      },
    },
  });

  await prisma.dIDDirectory.create({
    data: {
      did: issuerUniversity.did,
      serviceType: 'CredentialIssuer',
      endpoint: issuerUniversity.endpoint,
      metadata: {
        name: issuerUniversity.name,
        type: 'issuer',
        sector: 'education',
      },
    },
  });

  await prisma.dIDDirectory.create({
    data: {
      did: verifierCanada.did,
      serviceType: 'CredentialVerifier',
      endpoint: verifierCanada.endpoint,
      metadata: {
        name: verifierCanada.name,
        type: 'verifier',
        country: 'CA',
      },
    },
  });

  await prisma.dIDDirectory.create({
    data: {
      did: verifierEmployer.did,
      serviceType: 'CredentialVerifier',
      endpoint: verifierEmployer.endpoint,
      metadata: {
        name: verifierEmployer.name,
        type: 'verifier',
        sector: 'private',
      },
    },
  });

  console.log(`✅ Created ${5} DID directory entries\n`);

  // ============================================
  // AUDIT LOGS
  // ============================================
  console.log('📝 Creating Sample Audit Logs...');

  await prisma.auditLog.create({
    data: {
      actor: 'system',
      action: 'database.seed',
      resourceType: 'database',
      details: {
        message: 'Database seeded with initial test data',
        timestamp: new Date().toISOString(),
      },
      result: 'success',
    },
  });

  console.log(`✅ Created ${1} audit log\n`);
  */

  // ============================================
  // SUMMARY
  // ============================================
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ Database seed completed successfully (Clean Mode)!\n');
  console.log('📊 Summary:');
  console.log(`   • Trust Frameworks: 0 (Disabled)`);
  console.log(`   • Trust Registries: 0 (Disabled)`);
  console.log(`   • Credential Schemas: 0 (Disabled)`);
  console.log(`   • Issuers: 0 (Disabled)`);
  console.log(`   • Verifiers: 0 (Disabled)`);
  console.log(`   • Registry Recognitions: 0 (Disabled)`);
  console.log(`   • API Keys: 2 (Admin, Public)`);
  console.log(`   • DID Directory Entries: 0 (Disabled)`);
  console.log(`   • Audit Logs: 0 (Disabled)`);
  console.log('═══════════════════════════════════════════════════════════\n');

  // Print API Keys (for development use)
  console.log('🔑 API Keys (save these for testing):');
  console.log('═══════════════════════════════════════');
  console.log(`Admin Key:          ${adminKey}`);
  // console.log(`Registry Owner Key: ${registryKey}`); // Disabled
  console.log(`Public Key:         ${publicKey}`);
  console.log('═══════════════════════════════════════\n');
  console.log('⚠️  Note: These keys are for development only!');
  console.log('   Store them securely and never commit to version control.\n');
}

/**
 * Execute seed and handle errors
 */
main()
  .catch((e) => {
    console.error('❌ Error seeding database:');
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
