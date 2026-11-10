// Word lists for the synthetic seed (REQ-INST-002, REQ-ML-005).
//
// Everything here is invented. Company names are made-up combinations, people
// names are common first names with an initial, and every email uses the
// reserved example.test domain. Never add real companies or people.

import type { $Enums } from "../../node_modules/.generated/prisma/client.js";

type TagType = $Enums.TagType;
type ContractType = $Enums.ContractType;

export interface TagSeed {
  type: TagType;
  slug: string;
  label: string;
}

// Sector names are stored on companies.sector and as SECTOR tags. Companies
// are spread round-robin over this list, so 3+ companies always cover 3+
// sectors (REQ-INST-002, REQ-ML-002).
export const SECTORS = [
  { slug: "software", label: "Software" },
  { slug: "finance", label: "Finance" },
  { slug: "healthcare", label: "Healthcare" },
  { slug: "education", label: "Education" },
  { slug: "retail", label: "Retail" },
] as const;

export type SectorSlug = (typeof SECTORS)[number]["slug"];

export const SKILLS: TagSeed[] = [
  ["typescript", "TypeScript"],
  ["javascript", "JavaScript"],
  ["python", "Python"],
  ["java", "Java"],
  ["sql", "SQL"],
  ["react", "React"],
  ["react-native", "React Native"],
  ["node-js", "Node.js"],
  ["docker", "Docker"],
  ["figma", "Figma"],
  ["excel", "Excel"],
  ["power-bi", "Power BI"],
  ["machine-learning", "Machine learning"],
  ["agile", "Agile"],
  ["communication", "Communication"],
  ["english", "English"],
  ["customer-service", "Customer service"],
  ["sales", "Sales"],
].map(([slug, label]) => ({ type: "SKILL" as const, slug, label }));

export const LOCATIONS: TagSeed[] = [
  ["barcelona", "Barcelona"],
  ["madrid", "Madrid"],
  ["valencia", "Valencia"],
  ["sevilla", "Sevilla"],
  ["bilbao", "Bilbao"],
  ["remote", "Remote"],
].map(([slug, label]) => ({ type: "LOCATION" as const, slug, label }));

// One CONTRACT tag per contract_type enum value.
export const CONTRACTS: { type: ContractType; slug: string; label: string }[] = [
  { type: "FULL_TIME", slug: "full-time", label: "Full-time" },
  { type: "PART_TIME", slug: "part-time", label: "Part-time" },
  { type: "INTERNSHIP", slug: "internship", label: "Internship" },
  { type: "TEMPORARY", slug: "temporary", label: "Temporary" },
  { type: "FREELANCE", slug: "freelance", label: "Freelance" },
];

export interface RoleSeed {
  slug: string;
  label: string;
  // Job Card title.
  title: string;
  // Skill slugs a card for this role is tagged with (a subset is used).
  skills: string[];
  // Sectors whose companies publish this role.
  sectors: SectorSlug[];
  // Yearly salary range in EUR for a full-time position.
  salary: [number, number];
  summary: string;
}

export const ROLES: RoleSeed[] = [
  {
    slug: "backend-developer",
    label: "Backend developer",
    title: "Backend Developer",
    skills: ["typescript", "node-js", "sql", "docker", "java", "python"],
    sectors: ["software", "finance", "healthcare", "retail"],
    salary: [30000, 45000],
    summary: "Design and maintain the APIs and databases behind our product.",
  },
  {
    slug: "frontend-developer",
    label: "Frontend developer",
    title: "Frontend Developer",
    skills: ["typescript", "javascript", "react", "figma"],
    sectors: ["software", "retail", "education"],
    salary: [28000, 42000],
    summary: "Build accessible web interfaces together with our designers.",
  },
  {
    slug: "mobile-developer",
    label: "Mobile developer",
    title: "Mobile Developer",
    skills: ["react-native", "typescript", "javascript", "agile"],
    sectors: ["software", "healthcare", "retail"],
    salary: [30000, 44000],
    summary: "Ship new features in our iOS and Android app every two weeks.",
  },
  {
    slug: "data-analyst",
    label: "Data analyst",
    title: "Data Analyst",
    skills: ["sql", "python", "excel", "power-bi"],
    sectors: ["finance", "healthcare", "retail", "software"],
    salary: [27000, 38000],
    summary: "Turn raw data into reports and dashboards that guide decisions.",
  },
  {
    slug: "data-scientist",
    label: "Data scientist",
    title: "Data Scientist",
    skills: ["python", "machine-learning", "sql"],
    sectors: ["software", "finance", "healthcare"],
    salary: [34000, 50000],
    summary: "Build and evaluate models on anonymised data with the analytics team.",
  },
  {
    slug: "ux-designer",
    label: "UX designer",
    title: "UX Designer",
    skills: ["figma", "communication", "agile"],
    sectors: ["software", "education", "healthcare", "retail"],
    salary: [26000, 38000],
    summary: "Research user needs and design clear, simple screens.",
  },
  {
    slug: "product-manager",
    label: "Product manager",
    title: "Product Manager",
    skills: ["agile", "communication", "english", "excel"],
    sectors: ["software", "finance", "education"],
    salary: [35000, 52000],
    summary: "Own the roadmap of one product area and work closely with engineers.",
  },
  {
    slug: "qa-engineer",
    label: "QA engineer",
    title: "QA Engineer",
    skills: ["javascript", "python", "agile", "docker"],
    sectors: ["software", "finance", "healthcare"],
    salary: [26000, 36000],
    summary: "Plan and automate tests so every release is reliable.",
  },
  {
    slug: "teacher",
    label: "Teacher",
    title: "Coding Teacher",
    skills: ["communication", "javascript", "python", "english"],
    sectors: ["education"],
    salary: [22000, 30000],
    summary: "Teach programming basics to small groups of adult learners.",
  },
  {
    slug: "sales-representative",
    label: "Sales representative",
    title: "Sales Representative",
    skills: ["sales", "communication", "english", "customer-service"],
    sectors: ["retail", "finance", "software", "education"],
    salary: [21000, 32000],
    summary: "Look after a portfolio of business customers and grow it.",
  },
  {
    slug: "customer-support",
    label: "Customer support agent",
    title: "Customer Support Agent",
    skills: ["customer-service", "communication", "english"],
    sectors: ["retail", "finance", "healthcare", "software"],
    salary: [19000, 26000],
    summary: "Help customers by chat and phone and report recurring problems.",
  },
];

export const PERKS = [
  "Hybrid work",
  "Remote first",
  "Training budget",
  "Flexible hours",
  "Meal vouchers",
  "Private health insurance",
  "Gym membership",
  "Mentoring",
  "Team events",
  "Extra holidays",
];

// Fictional company names: a neutral prefix plus an ending that fits the
// company's sector, e.g. "Nimbus Health" for a healthcare company.
export const COMPANY_PREFIXES = [
  "Nimbus", "Ledgerly", "Brightpath", "Quillon", "Tidewell", "Orbita",
  "Pinecrest", "Lumen", "Vantly", "Corvio", "Mosaiq", "Hearthly",
  "Northbeam", "Kitebay", "Solvent", "Fernway", "Arcadia", "Pollen",
  "Zenith", "Marlow",
];
export const SECTOR_COMPANY_SUFFIXES: Record<SectorSlug, string[]> = {
  software: ["Labs", "Systems", "Digital", "Studio", "Software"],
  finance: ["Capital", "Pay", "Finance", "Ledger", "Invest"],
  healthcare: ["Health", "Care", "Clinics", "Medical", "Wellness"],
  education: ["Learning", "Academy", "School", "Courses", "Campus"],
  retail: ["Market", "Store", "Shop", "Goods", "Outlet"],
};

export const SECTOR_DESCRIPTIONS: Record<SectorSlug, string> = {
  software: "We build software products used by thousands of small businesses.",
  finance: "We make payments and personal finance simpler and more transparent.",
  healthcare: "We build tools that help clinics follow up with their patients.",
  education: "We run hands-on courses that help adults learn new skills.",
  retail: "We run a growing online shop with fast local delivery.",
};

export const FIRST_NAMES = [
  "Alex", "Sam", "Jordan", "Noa", "Leo", "Mia", "Hugo", "Lucia", "Martin",
  "Sofia", "Pau", "Laia", "Iker", "Nora", "Marc", "Julia", "Dani", "Irene",
  "Adrian", "Elena", "Bruno", "Clara", "Eric", "Vera",
];
export const LAST_INITIALS = "ABCDEFGHIJKLMNOPRSTUVZ";

export const EDUCATION_LEVELS = [
  "SECONDARY",
  "VOCATIONAL",
  "BACHELOR",
  "BACHELOR",
  "MASTER",
  "DOCTORATE",
] as const;

// Every seeded account has this password. It is synthetic and only valid on
// local development databases.
export const DEMO_PASSWORD = "adoptajob-demo";
export const DEMO_CANDIDATE_EMAIL = "candidate.demo@example.test";
export const DEMO_RECRUITER_EMAIL = "recruiter.demo@example.test";
export const COLD_START_CANDIDATE_EMAIL = "candidate.new@example.test";
export const PRIVACY_NOTICE_VERSION = "seed-v1";
