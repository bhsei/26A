# AdoptAJob Native Android client — contract status

## Client target

This client is aligned to the frontend-to-backend API proposal sent to Jean-Baptiste on 18 November 2026. That proposal was extracted from the Expo client and explicitly labelled provisional until the backend team approves and implements it. This Kotlin client adopts its route names, camelCase JSON keys, auth response (`token`), and request/response shapes.

## Consent fields

`POST /auth/register` sends:
- `email`
- `password`
- `role` (`candidate` or `recruiter`)
- `displayName`
- `ageConfirmed`
- `privacyAccepted`
- `companyName` and `companySector` for recruiter accounts

The UI requires the age confirmation and privacy acceptance. The SRS requires a privacy notice describing collected data, purpose, legal basis and retention. The displayed notice includes the retention periods in the SRS but controller/contact and lawful-basis details still require confirmation by the project's privacy owner.

## Routes used

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `POST /auth/logout`
- `GET` and `PUT /candidate/profile`
- `GET /candidate/feed`
- `POST /candidate/swipes`
- `GET` and `POST /recruiter/cards`
- `GET /recruiter/interested`
- `POST /recruiter/interested/{swipeId}/decision`
- `GET /matches`

## Known contract/backend limitations

- The 18 November API proposal is provisional, not a confirmed OpenAPI specification.
- The repository OpenAPI v0.1.0 is inconsistent with that proposal (including registration consent, endpoint naming, auth token key, card/profile models and missing recruiter/matches routes).
- The backend README states auth, feed/swipe persistence and matching integration are currently `501 Not Implemented`.
- Root Docker Compose starts PostgreSQL only; Fastify is run separately on port 3000 according to the backend README.
- The API proposal's recruiter card creation model and matches model contain privacy/authorization points that backend must enforce. The app does not treat client-side role checks as security.
- Full API coverage (chat, applications, reports, export/deletion, card update/delete) is not included in this MVP screen flow.

Do not describe this client as production-ready or fully integrated until the backend publishes an approved OpenAPI contract, implements the required routes, and end-to-end tests pass.
