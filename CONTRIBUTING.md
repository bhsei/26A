# Contributing to AdoptAJob

Thank you for contributing to AdoptAJob. This repository is a public course
repository, so every contribution must be reproducible, reviewable and free of
secrets or real personal data.

## Before starting work

1. Confirm the issue, document or implementation unit you are going to change.
2. Update your local branch:

   ```bash
   git pull --rebase
   ```

3. Read the relevant requirements in
   [`docs/requirements/SRS.md`](docs/requirements/SRS.md).
4. Check the ownership and sequence in
   [`plans/INIT_PLAN.md`](plans/INIT_PLAN.md).

Do not begin a second unrelated change in the same working tree. Keep each
commit focused on one document or one coherent technical unit.

## Repository rules

- Documentation, code comments, commit messages, issue templates and UI
  strings are written in English.
- Use synthetic data only. Never commit real candidate, recruiter or company
  data, real CVs, passwords, tokens, API keys or other secrets.
- Keep local configuration in `.env`; commit only safe variable names and
  examples in `.env.example`.
- Do not add an out-of-scope web client, payments, video interviews, external
  job-board integration or analytics dashboard.
- Keep the backend as the single owner of PostgreSQL schema migrations.
- Keep PostgreSQL as the relational source of truth for application data;
  changes to the Neo4j graph must go through the agreed harmonization pipeline.
- Do not use protected attributes or photos as ranking inputs.

## Branch and commit workflow

The course workflow uses small commits that can be inspected independently:

1. Pull the latest `main` with `git pull --rebase`.
2. Make one coherent change.
3. Run the smallest relevant checks.
4. Review the diff:

   ```bash
   git diff --check
   git status --short
   git diff --stat
   ```

5. Stage only files belonging to that change.
6. Commit using:

   ```text
   W<N> - <change summary>; <change description>
   ```

   Replace `W<N>` with the applicable course week when creating the commit.
7. Push the commit:

   ```bash
   git push origin main
   ```

Do not amend or rewrite a published commit unless the team explicitly agrees
to do so.

## Local checks

Run checks relevant to the files changed. The complete commands will become
available as the components are initialized.

```bash
# General
git diff --check

# Backend
npm ci
npm test
npm run lint
npm run format:check

# Matching service
uv sync --locked
uv run pytest --cov=app --cov-fail-under=60
uv run ruff check .
uv run black --check .

# Mobile
npm ci
npx expo start
```

Do not report a check as passing if it was not run. Mention unavailable local
tools or environment limitations in the pull request.

## Documentation and SRS changes

Create one commit per document or coherent documentation unit. For changes to
the SRS after version 1.0:

1. Open a GitHub Issue describing the proposed requirement change.
2. Obtain agreement from at least three team members.
3. Commit the SRS change separately using the course convention.
4. Add a new revision-history entry and version number.
5. Update affected test cases and traceability links.

Do not silently resolve the open GDPR scope, retention policy or other team
decisions in implementation code. Record decisions in the appropriate plan or
design document first.

## Review process

Use a pull request for changes that need technical review. For cross-team
document review, use a GitHub Issue with the
[document-review template](.github/ISSUE_TEMPLATE/document-review.md).

Reviewers should:

- identify the exact file, section, requirement ID or line;
- classify the finding;
- explain the problem and its impact;
- provide a concrete recommendation;
- use one comment per finding;
- verify that the author has addressed or explicitly dispositioned each
  finding.

## Pull request checklist

- [ ] The change is limited to the stated scope.
- [ ] The relevant SRS requirements and test artifacts are identified.
- [ ] No secrets or real personal data are included.
- [ ] Synthetic fixtures are reproducible.
- [ ] Documentation is in English.
- [ ] Relevant tests, lint and formatting checks were run.
- [ ] `git diff --check` passes.
- [ ] The PR description explains unfinished work or known limitations.
- [ ] The change does not introduce a second database migration owner.
