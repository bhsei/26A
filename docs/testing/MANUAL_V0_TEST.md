# AdoptAJob V0 Manual Test Guide

This guide verifies the first usable backend integration with PostgreSQL,
the matching service and the Kotlin Android client. Synthetic data only.

## 1. Set Node.js 22

The backend and matching manifest use Node.js 22. Node.js 24 is outside the
declared engine range.

From PowerShell:

```powershell
nvm install 22.23.5
nvm use 22.23.5
node --version
npm --version
```

If `nvm` is unavailable:

```powershell
winget install OpenJS.NodeJS.LTS
```

Then close and reopen the terminal. Confirm `node --version` begins with `v22`.

## 2. Configure local environment

At repository root:

```powershell
Copy-Item .env.example .env
```

Set unique local values in `.env`. Never commit `.env`. Minimum variables:

```text
POSTGRES_DB=adoptajob
POSTGRES_USER=adoptajob
POSTGRES_PASSWORD=<local-only-password>
POSTGRES_PORT=5432
DATABASE_URL=postgresql://adoptajob:<local-only-password>@localhost:5432/adoptajob?schema=public
JWT_SECRET=<at-least-32-random-local-characters>
MATCHING_SERVICE_URL=http://matching:4000
MATCHING_SERVICE_API_KEY=<at-least-16-local-characters>
```

## 3. Start and seed the stack

```powershell
docker compose up -d postgres
docker compose ps
cd src/backend
npm ci
npm run db:generate
npm run db:deploy
npm run db:seed
cd ../..
docker compose up -d backend matching
docker compose ps
```

The seed is destructive for the local application tables and refuses non-local
database hosts. It must use only synthetic accounts and data.

## 4. Static implementation checks

Run from `src/backend`:

```powershell
npm run typecheck
npm run build
npm test
npm run db:validate
```

Run from `src/matching-service`:

```powershell
npm ci
npm run build
```

Run from repository root:

```powershell
npx @redocly/cli lint docs/design/openapi.yaml
git diff --check
docker compose config
```

All checks should pass. If Docker is unavailable, stop and record the
environment blocker; do not infer database or HTTP success.

## 5. Verify health and readiness

```powershell
curl.exe -i http://localhost:3000/health
curl.exe -i http://localhost:3000/ready
curl.exe -i http://localhost:4000/health
```

Expected:

- backend `/health`: `200`, `{ "status": "ok", "service": "backend" }`
- backend `/ready`: `200` when PostgreSQL and matching are up
- matching `/health`: `200`
- Every response includes `X-Request-ID`

## 6. Verify registration and login

Candidate registration:

```powershell
$body = @{
  email = "maya.manual@example.test"
  password = "ManualPass123"
  role = "candidate"
  displayName = "Maya Manual"
  ageConfirmed = $true
  privacyAccepted = $true
} | ConvertTo-Json

Invoke-RestMethod -Method Post -Uri "http://localhost:3000/auth/register" `
  -ContentType "application/json" -Body $body
```

Save the returned `token`:

```powershell
$token = "<paste-token>"
```

Verify session restoration and logout:

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/auth/me" `
  -Headers @{ Authorization = "Bearer $token" }

Invoke-RestMethod -Method Post -Uri "http://localhost:3000/auth/logout" `
  -Headers @{ Authorization = "Bearer $token" }

Invoke-RestMethod -Method Get -Uri "http://localhost:3000/auth/me" `
  -Headers @{ Authorization = "Bearer $token" }
```

The session call after logout must return `401 UNAUTHORIZED`.

Test a second email with the same registration body. It must return
`409 CONFLICT`. Test missing consent and it must return
`422 VALIDATION_ERROR`.

## 7. Verify candidate profile

Log in again and save the new token.

```powershell
$profile = @{
  displayName = "Maya Manual"
  desiredRoles = "Backend Engineer"
  skills = @("TypeScript", "SQL")
  educationLevel = "Bachelor"
  experienceYears = "2"
  preferredLocations = "Remote"
  contractType = "Full-time"
} | ConvertTo-Json

Invoke-RestMethod -Method Put -Uri "http://localhost:3000/candidate/profile" `
  -ContentType "application/json" -Headers @{ Authorization = "Bearer $token" } `
  -Body $profile

Invoke-RestMethod -Method Get -Uri "http://localhost:3000/candidate/profile" `
  -Headers @{ Authorization = "Bearer $token" }
```

Confirm the response has the `profile` wrapper, camelCase fields and `userId`.

## 8. Verify feed and matching fallback

```powershell
Invoke-RestMethod -Method Get `
  -Uri "http://localhost:3000/candidate/feed?limit=20" `
  -Headers @{ Authorization = "Bearer $token"; "X-Request-ID" = "manual-feed-001" }
```

Save a returned card ID.

Fallback test:

1. Stop matching:
   `docker compose stop matching`
2. Repeat the feed request.
3. Within 1 second, `source` must be `POSTGRESQL_FALLBACK`.
4. Cards must be published and ordered by publication date.
5. Restart:
   `docker compose start matching`

## 9. Verify swipe and idempotency

Generate a UUID v4:

```powershell
$key = [guid]::NewGuid().ToString()
$swipe = @{
  cardId = "<published-job-card-id>"
  action = "LIKE"
} | ConvertTo-Json

$headers = @{
  Authorization = "Bearer $token"
  "Idempotency-Key" = $key
  "X-Request-ID" = "manual-swipe-001"
}

Invoke-RestMethod -Method Post -Uri "http://localhost:3000/candidate/swipes" `
  -ContentType "application/json" -Headers $headers -Body $swipe

Invoke-RestMethod -Method Post -Uri "http://localhost:3000/candidate/swipes" `
  -ContentType "application/json" -Headers $headers -Body $swipe
```

Replay with the same key and same body must not create a second row. Replay
with a different body must return `409 CONFLICT`.

Verify `PASS`, `GREEN_FLAG`, and `RED_FLAG` do not create matches.

## 10. Verify recruiter flow

Register or log in with the seeded recruiter account. Its credentials are
listed in `src/backend/README.md` and must remain synthetic.

Create a card only for the recruiter’s authorized company:

```powershell
$card = @{
  kind = "JOB"
  companyName = "<authorized-company-name>"
  sector = "<authorized-sector>"
  title = "Manual Test Engineer"
  description = "Synthetic job card for V0 verification."
  location = "Remote"
  contractType = "Full-time"
  tags = @("TypeScript", "SQL")
} | ConvertTo-Json

$recruiterToken = "<paste-recruiter-token>"
Invoke-RestMethod -Method Post -Uri "http://localhost:3000/recruiter/cards" `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $recruiterToken" } -Body $card
```

Then list interested candidates:

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/recruiter/interested" `
  -Headers @{ Authorization = "Bearer $recruiterToken" }
```

Save a swipe ID and accept it:

```powershell
$decision = @{ decision = "ACCEPT" } | ConvertTo-Json
Invoke-RestMethod -Method Post `
  -Uri "http://localhost:3000/recruiter/interested/<swipe-id>/decision" `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $recruiterToken" } -Body $decision
```

Confirm:

- candidate receives the match via `GET /matches`
- recruiter receives the match via `GET /matches`
- no counterparty email is disclosed
- decline creates no match
- cross-company decision returns `404 NOT_FOUND` or `403 FORBIDDEN`

## 11. Verify the Kotlin Android client

On Android emulator:

1. Set the API base to `http://10.0.2.2:3000/`.
2. Register a candidate.
3. Update the candidate profile.
4. Open the feed and verify cards and empty/loading/error states.
5. Swipe or use visible action buttons.
6. Reopen the app and verify `/auth/me` restores the session.
7. Log out and verify protected screens require login again.

On a physical device, use the workstation LAN IP and `-PAPI_BASE_URL=`.

## 12. Acceptance record

Record evidence in the individual worklog:

- Node and npm versions
- Docker compose status
- Migration and seed counts
- Health/readiness request IDs
- Registration, login, logout and revocation status
- Profile response
- Matching and fallback source
- Swipe replay and conflict status
- Recruiter decision and match visibility
- Android registration/feed/swipe/match flow
