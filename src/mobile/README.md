## API URL configuration

The Fastify backend uses port **3000** for local development. When running the Android app in the Android Studio emulator, use `10.0.2.2` to access services running on your computer.

The default API URL is:

```text
http://10.0.2.2:3000/
```

The URL is configured through `BuildConfig.API_BASE_URL`, so it can be changed without modifying Kotlin source code.

**Android emulator (default):**
```powershell
.\gradlew.bat assembleDebug
```

**Physical Android phone on the same LAN (replace with your computer's LAN IP):**
```powershell
.\gradlew.bat assembleDebug -PAPI_BASE_URL=http://192.168.1.20:3000/
```

**Hosted backend:**
```powershell
.\gradlew.bat assembleDebug -PAPI_BASE_URL=https://your-api.example.org/
```

Alternatively, configure the `API_BASE_URL` environment variable. The Gradle property takes precedence if both are provided.

Debug builds permit cleartext HTTP for local development. Release builds disable cleartext HTTP and should use HTTPS.
