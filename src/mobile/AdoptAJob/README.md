# AdoptAJob — Native Android client

**Stack:** Kotlin, Jetpack Compose, Material 3, AndroidX Security Crypto, Gson and coroutines.


## API URL configuration

The Fastify backend README specifies **port 3000** for local development. The emulator's host-machine address is therefore:

`http://10.0.2.2:3000/`

The URL is configured once through `BuildConfig.API_BASE_URL`. Changing it without editing Kotlin source:

```powershell
# Android emulator (default)
.\gradlew.bat assembleDebug

# Physical Android phone on the same LAN (replace with the PC's LAN IP)
.\gradlew.bat assembleDebug -PAPI_BASE_URL=http://192.168.1.20:3000/

# Hosted backend
.\gradlew.bat assembleDebug -PAPI_BASE_URL=https://your-api.example.org/
```

I can also set the `API_BASE_URL` environment variable. The Gradle property takes precedence. Debug builds permit cleartext HTTP for local development; release builds disable cleartext HTTP and should use HTTPS.

## What this client now sends

The frontend follows the API proposal sent to Jean-Baptiste on 18 November 2026 (camelCase JSON):

| Feature | Method and path |
|---|---|
| Register | `POST /auth/register` |
| Login | `POST /auth/login` |
| Restore session | `GET /auth/me` |
| Logout | `POST /auth/logout` |
| Candidate profile | `GET/PUT /candidate/profile` |
| Candidate feed | `GET /candidate/feed` |
| Candidate swipe | `POST /candidate/swipes` |
| Recruiter cards | `GET/POST /recruiter/cards` |
| Interested candidates | `GET /recruiter/interested` |
| Recruiter decision | `POST /recruiter/interested/{swipeId}/decision` |
| Matches | `GET /matches` |

Registration sends `displayName`, `ageConfirmed`, and `privacyAccepted`; recruiter registration also sends `companyName` and `companySector`. It requires the age confirmation and privacy acceptance before sending the request. The privacy notice shown in the app is a project draft; confirm controller/contact and lawful-basis wording before production.

The client uses `token` from the `{ user, token }` authentication response, Bearer authorization, camelCase JSON, and an `Idempotency-Key` on swipe requests.

## Backend integration status

The authoritative contract is `docs/design/openapi.yaml`. The Kotlin client
targets port 3000 and uses authentication, candidate profile/feed/swipe,
recruiter card, interested-candidate decision and match routes. Start the
backend and matching service through the root Docker Compose setup before
launching the app on the emulator or a physical device.

## Build and test

```powershell
.\gradlew.bat test
.\gradlew.bat assembleDebug
```

The Android project uses Gradle 8.9 with Android Gradle Plugin 8.7.3 and Java 17.

## GitHub hygiene

- I have not or  will not committing `local.properties`, `.env`, signing keys, API secrets, `build/`, or `.gradle/`.
- The source project and Gradle wrapper both are in Git.
- I am Pushing to a feature branch and open a pull request unless the team explicitly agreed to commit directly to `main`.
- I and Jean-Baptiste we should  Confirm that the API proposal is the agreed contract before claiming integration is complete.
