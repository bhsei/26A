-- AdoptAJob mock data (synthetic, hand-written).
--
-- A small dataset with fixed IDs and known relationships for development and
-- tests. It is not the demo seed (INIT_PLAN Commit 09), which will be larger
-- and generated.
--
-- WARNING: this script EMPTIES every application table before inserting.
-- Run it only against a local development database.
--
-- Load it from the repository root:
--   docker compose exec -T postgres sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < tests/fixtures/synthetic/mock-data.sql
--
-- All people, companies and emails are fictional (example.test domain).
-- password_hash holds a placeholder, so these accounts cannot sign in.
--
-- ID scheme (fixed UUIDs, easy to recognise):
--   companies   c0000000-0000-0000-0000-00000000000N
--   recruiters  b0000000-0000-0000-0000-00000000000N
--   candidates  a0000000-0000-0000-0000-00000000000N
--   cards       d0000000-0000-0000-0000-00000000000N
--   matches     e0000000-0000-0000-0000-00000000000N
--
-- Expected results (use these in tests):
--   * Collaborative signal for REQ-ML-007: candidates A and B both liked card
--     D1 (Mobile Developer); B also liked D3 (Data Analyst) and D4 (Data
--     Analyst Intern, declined by the recruiter but still a like). D3 and D4
--     should be recommended to A by the graph, each with 1 similar candidate.
--   * Feed of candidate A (REQ-FUNC-011): D2, D3, D4, D6. D1 is liked, D5 is
--     passed, D7 is a draft.
--   * Candidate A green-flagged D2 (REQ-ML-003); candidate D red-flagged D3
--     (REQ-ML-004).
--   * Candidate C skipped onboarding and has no swipes: cold start
--     (REQ-ML-002) with all 6 published cards across 3 sectors.
--   * Interested candidates for D1 (REQ-FUNC-016): B is pending; A was
--     accepted, which created match E1 with recruiter B1.

BEGIN;

TRUNCATE users, companies, candidate_profiles, tags, card_tags, candidate_tags,
  cards, swipes, flags, matches, messages, applications, reports
  RESTART IDENTITY CASCADE;

-- Tags ---------------------------------------------------------------------

INSERT INTO tags (id, type, slug, label) VALUES
  (1,  'SKILL',    'typescript',         'TypeScript'),
  (2,  'SKILL',    'python',             'Python'),
  (3,  'SKILL',    'react-native',       'React Native'),
  (4,  'SKILL',    'sql',                'SQL'),
  (5,  'SKILL',    'figma',              'Figma'),
  (6,  'ROLE',     'backend-developer',  'Backend developer'),
  (7,  'ROLE',     'mobile-developer',   'Mobile developer'),
  (8,  'ROLE',     'data-analyst',       'Data analyst'),
  (9,  'ROLE',     'ux-designer',        'UX designer'),
  (10, 'SECTOR',   'software',           'Software'),
  (11, 'SECTOR',   'finance',            'Finance'),
  (12, 'SECTOR',   'healthcare',         'Healthcare'),
  (13, 'LOCATION', 'barcelona',          'Barcelona'),
  (14, 'LOCATION', 'madrid',             'Madrid'),
  (15, 'LOCATION', 'remote',             'Remote'),
  (16, 'CONTRACT', 'full-time',          'Full-time'),
  (17, 'CONTRACT', 'internship',         'Internship');

SELECT setval(pg_get_serial_sequence('tags', 'id'), (SELECT max(id) FROM tags));

-- Companies and recruiters --------------------------------------------------

INSERT INTO companies (id, name, sector, updated_at) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'Nimbus Labs (mock)', 'Software',   now()),
  ('c0000000-0000-0000-0000-000000000002', 'Ledgerly (mock)',    'Finance',    now()),
  ('c0000000-0000-0000-0000-000000000003', 'CareLoop (mock)',    'Healthcare', now());

INSERT INTO users (id, email, password_hash, role, display_name, company_id, privacy_consent_at, privacy_notice_version, updated_at) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'recruiter.nimbus@example.test',   'mock-not-a-real-hash', 'RECRUITER', 'Recruiter B1 (mock)', 'c0000000-0000-0000-0000-000000000001', now(), 'mock-v1', now()),
  ('b0000000-0000-0000-0000-000000000002', 'recruiter.ledgerly@example.test', 'mock-not-a-real-hash', 'RECRUITER', 'Recruiter B2 (mock)', 'c0000000-0000-0000-0000-000000000002', now(), 'mock-v1', now()),
  ('b0000000-0000-0000-0000-000000000003', 'recruiter.careloop@example.test', 'mock-not-a-real-hash', 'RECRUITER', 'Recruiter B3 (mock)', 'c0000000-0000-0000-0000-000000000003', now(), 'mock-v1', now());

-- Candidates ----------------------------------------------------------------

INSERT INTO users (id, email, password_hash, role, display_name, company_id, privacy_consent_at, privacy_notice_version, updated_at) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'candidate.a@example.test', 'mock-not-a-real-hash', 'CANDIDATE', 'Candidate A (mock)', NULL, now(), 'mock-v1', now()),
  ('a0000000-0000-0000-0000-000000000002', 'candidate.b@example.test', 'mock-not-a-real-hash', 'CANDIDATE', 'Candidate B (mock)', NULL, now(), 'mock-v1', now()),
  ('a0000000-0000-0000-0000-000000000003', 'candidate.c@example.test', 'mock-not-a-real-hash', 'CANDIDATE', 'Candidate C (mock)', NULL, now(), 'mock-v1', now()),
  ('a0000000-0000-0000-0000-000000000004', 'candidate.d@example.test', 'mock-not-a-real-hash', 'CANDIDATE', 'Candidate D (mock)', NULL, now(), 'mock-v1', now());

-- C skipped onboarding: profile exists with every field empty.
INSERT INTO candidate_profiles (user_id, education_level, years_experience, updated_at) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'BACHELOR', 1,    now()),
  ('a0000000-0000-0000-0000-000000000002', 'MASTER',   3,    now()),
  ('a0000000-0000-0000-0000-000000000003', NULL,       NULL, now()),
  ('a0000000-0000-0000-0000-000000000004', 'BACHELOR', 0,    now());

INSERT INTO candidate_tags (candidate_id, tag_id) VALUES
  -- A: mobile developer in Barcelona
  ('a0000000-0000-0000-0000-000000000001', 1),
  ('a0000000-0000-0000-0000-000000000001', 3),
  ('a0000000-0000-0000-0000-000000000001', 7),
  ('a0000000-0000-0000-0000-000000000001', 13),
  ('a0000000-0000-0000-0000-000000000001', 16),
  -- B: data analyst, remote
  ('a0000000-0000-0000-0000-000000000002', 2),
  ('a0000000-0000-0000-0000-000000000002', 4),
  ('a0000000-0000-0000-0000-000000000002', 8),
  ('a0000000-0000-0000-0000-000000000002', 15),
  -- D: UX design internship
  ('a0000000-0000-0000-0000-000000000004', 5),
  ('a0000000-0000-0000-0000-000000000004', 9),
  ('a0000000-0000-0000-0000-000000000004', 17);

-- Cards ---------------------------------------------------------------------

INSERT INTO cards (id, company_id, created_by_id, kind, status, title, description, location, contract_type, salary_min, salary_max, salary_currency, perks, published_at, updated_at) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'JOB', 'PUBLISHED',
   'Mobile Developer', 'Build the React Native app for our scheduling product.', 'Barcelona', 'FULL_TIME', 30000, 38000, 'EUR', ARRAY['Hybrid work', 'Training budget'], now() - interval '6 days', now()),
  ('d0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'JOB', 'PUBLISHED',
   'Backend Developer', 'Design and maintain TypeScript APIs and PostgreSQL schemas.', 'Remote', 'FULL_TIME', 32000, 40000, 'EUR', ARRAY['Remote first'], now() - interval '5 days', now()),
  ('d0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'JOB', 'PUBLISHED',
   'Data Analyst', 'Analyse payment data with SQL and Python and build reports.', 'Madrid', 'FULL_TIME', 28000, 34000, 'EUR', ARRAY[]::text[], now() - interval '4 days', now()),
  ('d0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002', 'JOB', 'PUBLISHED',
   'Data Analyst Intern', 'Six-month internship supporting the analytics team.', 'Remote', 'INTERNSHIP', NULL, NULL, NULL, ARRAY['Mentoring'], now() - interval '3 days', now()),
  ('d0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'JOB', 'PUBLISHED',
   'UX Designer Intern', 'Design patient-facing screens with Figma.', 'Barcelona', 'INTERNSHIP', NULL, NULL, NULL, ARRAY[]::text[], now() - interval '2 days', now()),
  ('d0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'COMPANY', 'PUBLISHED',
   'CareLoop (mock)', 'We build software that helps clinics follow up with patients.', NULL, NULL, NULL, NULL, NULL, ARRAY[]::text[], now() - interval '1 day', now()),
  -- Draft: never shown in any feed.
  ('d0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003', 'JOB', 'DRAFT',
   'Mobile Developer', 'Draft card, not published yet.', 'Barcelona', 'FULL_TIME', NULL, NULL, NULL, ARRAY[]::text[], NULL, now());

INSERT INTO card_tags (card_id, tag_id) VALUES
  ('d0000000-0000-0000-0000-000000000001', 3), ('d0000000-0000-0000-0000-000000000001', 1), ('d0000000-0000-0000-0000-000000000001', 7),
  ('d0000000-0000-0000-0000-000000000001', 10), ('d0000000-0000-0000-0000-000000000001', 13), ('d0000000-0000-0000-0000-000000000001', 16),
  ('d0000000-0000-0000-0000-000000000002', 1), ('d0000000-0000-0000-0000-000000000002', 4), ('d0000000-0000-0000-0000-000000000002', 6),
  ('d0000000-0000-0000-0000-000000000002', 10), ('d0000000-0000-0000-0000-000000000002', 15), ('d0000000-0000-0000-0000-000000000002', 16),
  ('d0000000-0000-0000-0000-000000000003', 2), ('d0000000-0000-0000-0000-000000000003', 4), ('d0000000-0000-0000-0000-000000000003', 8),
  ('d0000000-0000-0000-0000-000000000003', 11), ('d0000000-0000-0000-0000-000000000003', 14), ('d0000000-0000-0000-0000-000000000003', 16),
  ('d0000000-0000-0000-0000-000000000004', 2), ('d0000000-0000-0000-0000-000000000004', 8), ('d0000000-0000-0000-0000-000000000004', 11),
  ('d0000000-0000-0000-0000-000000000004', 15), ('d0000000-0000-0000-0000-000000000004', 17),
  ('d0000000-0000-0000-0000-000000000005', 5), ('d0000000-0000-0000-0000-000000000005', 9), ('d0000000-0000-0000-0000-000000000005', 12),
  ('d0000000-0000-0000-0000-000000000005', 13), ('d0000000-0000-0000-0000-000000000005', 17),
  ('d0000000-0000-0000-0000-000000000006', 12),
  ('d0000000-0000-0000-0000-000000000007', 3), ('d0000000-0000-0000-0000-000000000007', 7), ('d0000000-0000-0000-0000-000000000007', 12);

-- Swipes and flags ----------------------------------------------------------

INSERT INTO swipes (candidate_id, card_id, action, decision, decided_at) VALUES
  -- A and B both like D1; B also likes D3 (collaborative signal for A).
  ('a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'LIKE', 'ACCEPTED', now() - interval '1 day'),
  ('a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'LIKE', 'PENDING',  NULL),
  ('a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000003', 'LIKE', 'PENDING',  NULL),
  ('a0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000004', 'LIKE', 'DECLINED', now() - interval '2 hours'),
  ('a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000005', 'PASS', NULL,       NULL),
  ('a0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000005', 'LIKE', 'PENDING',  NULL);

INSERT INTO flags (candidate_id, card_id, kind) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'GREEN'),
  ('a0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000003', 'RED');

-- Match, chat, application and report --------------------------------------

INSERT INTO matches (id, candidate_id, recruiter_id, card_id) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001');

INSERT INTO messages (match_id, sender_id, body, created_at) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Hi! Thanks for your interest in the Mobile Developer role. (mock)', now() - interval '20 hours'),
  ('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Hello, happy to talk. When are you available? (mock)', now() - interval '19 hours');

INSERT INTO applications (match_id, message) VALUES
  ('e0000000-0000-0000-0000-000000000001', 'I would like to apply for the Mobile Developer position. (mock)');

INSERT INTO reports (reporter_id, target_type, target_id, reason) VALUES
  ('a0000000-0000-0000-0000-000000000004', 'CARD', 'd0000000-0000-0000-0000-000000000006', 'Mock report used for testing.');

COMMIT;
