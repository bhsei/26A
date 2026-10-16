# Synthetic fixtures

This directory will contain generated fixtures for tests and local demos.

> **Placeholder:** Only synthetic data is allowed here. Never add exported
> production records, real CVs or other real personal data.


## Mock data

[`mock-data.sql`](mock-data.sql) is a small hand-written dataset with fixed IDs
for development and tests: 3 companies, 3 recruiters, 4 candidates, 17 tags,
7 cards (6 published, 1 draft), swipes, flags, one match with chat messages,
one application and one report. Its header lists the expected results, such as
each candidate's feed and the graph recommendations (REQ-ML-007).

It is not the demo seed (INIT_PLAN Commit 09). **It empties every application
table first**, so load it only into your local database. From the repository
root:

```bash
docker compose exec -T postgres sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < tests/fixtures/synthetic/mock-data.sql
```

The script can be run again at any time and always produces the same data.
