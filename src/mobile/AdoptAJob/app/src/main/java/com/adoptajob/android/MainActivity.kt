package com.adoptajob.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.adoptajob.android.data.*
import kotlinx.coroutines.launch
import java.util.UUID

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val api = ApiClient(BuildConfig.API_BASE_URL)
        val session = SessionStore(this)
        setContent {
            MaterialTheme(colorScheme = lightColorScheme(
                primary = Color(0xFF3457D5),
                secondary = Color(0xFF14A38B),
                background = Color(0xFFF6F7FB)
            )) { AdoptAJobApp(api, session) }
        }
    }
}

@Composable
private fun AdoptAJobApp(api: ApiClient, session: SessionStore) {
    var token by remember { mutableStateOf(session.token()) }
    var role by remember { mutableStateOf("candidate") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var displayName by remember { mutableStateOf("") }
    var companyName by remember { mutableStateOf("") }
    var companySector by remember { mutableStateOf("") }
    var ageConfirmed by remember { mutableStateOf(false) }
    var privacyAccepted by remember { mutableStateOf(false) }
    var registerMode by remember { mutableStateOf(false) }
    var cards by remember { mutableStateOf<List<JobCard>>(emptyList()) }
    var message by remember { mutableStateOf<String?>(null) }
    var loading by remember { mutableStateOf(false) }
    var selectedTab by remember { mutableStateOf("Feed") }
    val scope = rememberCoroutineScope()

    fun reportError(t: Throwable) { message = t.message ?: "Something went wrong. Please try again." }

    suspend fun loadFeed() {
        val active = token ?: return
        loading = true
        try {
            cards = api.get<FeedResponse>("candidate/feed", active).cards
            message = if (cards.isEmpty()) "No opportunities are available yet." else null
        } catch (t: Throwable) { reportError(t) }
        finally { loading = false }
    }

    LaunchedEffect(token) {
        val active = token
        if (active != null) {
            try {
                val current = api.get<MeResponse>("auth/me", active)
                role = current.user.role.lowercase()
                if (role == "candidate") loadFeed()
            } catch (t: Throwable) {
                session.clear()
                token = null
                reportError(t)
            }
        }
    }

    Surface(Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
        if (token == null) {
            AuthScreen(
                email, { email = it }, password, { password = it },
                displayName, { displayName = it },
                companyName, { companyName = it },
                companySector, { companySector = it },
                role, { role = it },
                ageConfirmed, { ageConfirmed = it },
                privacyAccepted, { privacyAccepted = it },
                registerMode, { registerMode = it },
                loading, message,
                onSubmit = {
                    if (registerMode && (!ageConfirmed || !privacyAccepted)) {
                        message = "Please confirm the age requirement and accept the privacy notice."
                    } else if (registerMode && displayName.isBlank()) {
                        message = "Please enter your full name."
                    } else if (registerMode && role == "recruiter" && (companyName.isBlank() || companySector.isBlank())) {
                        message = "Recruiter accounts require a company name and sector."
                    } else {
                        loading = true
                        message = null
                        scope.launch {
                            try {
                                val result = if (registerMode) {
                                    api.post<AuthResponse>("auth/register", RegisterRequest(
                                        email = email.trim(), password = password, role = role,
                                        displayName = displayName.trim(), ageConfirmed = ageConfirmed,
                                        privacyAccepted = privacyAccepted,
                                        companyName = companyName.trim().takeIf { role == "recruiter" },
                                        companySector = companySector.trim().takeIf { role == "recruiter" }
                                    ))
                                } else {
                                    api.post<AuthResponse>("auth/login", LoginRequest(email.trim(), password))
                                }
                                session.save(result.token)
                                token = result.token
                                role = result.user.role.lowercase()
                                selectedTab = if (role == "candidate") "Feed" else "Recruiter"
                            } catch (t: Throwable) { reportError(t) }
                            finally { loading = false }
                        }
                    }
                }
            )
        } else {
            Column(Modifier.fillMaxSize().padding(18.dp)) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Column {
                        Text("AdoptAJob", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
                        Text(if (role == "candidate") "Find work that fits you" else "Recruiter workspace", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                    TextButton(onClick = {
                        scope.launch {
                            runCatching { api.postEmpty<Unit>("auth/logout", token) }
                            session.clear(); token = null; cards = emptyList(); message = null
                        }
                    }) { Text("Sign out") }
                }
                Spacer(Modifier.height(12.dp))
                val tabs = if (role == "candidate") listOf("Feed", "Profile", "Matches") else listOf("Recruiter")
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    tabs.forEach { tab ->
                        FilterChip(selected = selectedTab == tab, onClick = { selectedTab = tab }, label = { Text(tab) })
                    }
                }
                Spacer(Modifier.height(12.dp))
                Box(Modifier.weight(1f)) {
                    when {
                        role == "candidate" && selectedTab == "Feed" -> CandidateFeed(
                            cards, loading, message,
                            onRefresh = { scope.launch { loadFeed() } },
                            onSwipe = { card, action ->
                                loading = true
                                scope.launch {
                                    try {
                                        api.post<Unit>("candidate/swipes", SwipeRequest(card.id, action), token,
                                            mapOf("Idempotency-Key" to UUID.randomUUID().toString()))
                                        cards = cards.filterNot { it.id == card.id }
                                        message = if (cards.isEmpty()) "No more cards. Refresh to check again." else null
                                    } catch (t: Throwable) { reportError(t) }
                                    finally { loading = false }
                                }
                            }
                        )
                        role == "candidate" && selectedTab == "Profile" -> CandidateProfileScreen(api, token, ::reportError)
                        role == "candidate" && selectedTab == "Matches" -> MatchesScreen(api, token, ::reportError)
                        role == "recruiter" -> RecruiterScreen(api, token, ::reportError)
                        else -> Notice("This section is not available for this account role.")
                    }
                }
                message?.let { Text(it, color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall) }
            }
        }
    }
}

@Composable
private fun AuthScreen(
    email: String, onEmail: (String) -> Unit,
    password: String, onPassword: (String) -> Unit,
    displayName: String, onDisplayName: (String) -> Unit,
    companyName: String, onCompanyName: (String) -> Unit,
    companySector: String, onCompanySector: (String) -> Unit,
    role: String, onRole: (String) -> Unit,
    ageConfirmed: Boolean, onAgeConfirmed: (Boolean) -> Unit,
    privacyAccepted: Boolean, onPrivacyAccepted: (Boolean) -> Unit,
    register: Boolean, onRegister: (Boolean) -> Unit,
    loading: Boolean, message: String?, onSubmit: () -> Unit
) {
    Column(Modifier.fillMaxSize().padding(24.dp), verticalArrangement = Arrangement.Center) {
        Text("AdoptAJob", style = MaterialTheme.typography.displaySmall, fontWeight = FontWeight.Bold)
        Text("A simpler way to discover your next opportunity.", color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(24.dp))
        Text(if (register) "Create your account" else "Welcome back", style = MaterialTheme.typography.headlineSmall)
        OutlinedTextField(email, onEmail, Modifier.fillMaxWidth(), label = { Text("Email") }, singleLine = true, keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email))
        Spacer(Modifier.height(8.dp))
        OutlinedTextField(password, onPassword, Modifier.fillMaxWidth(), label = { Text("Password") }, singleLine = true, visualTransformation = PasswordVisualTransformation(), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password))
        if (register) {
            Spacer(Modifier.height(8.dp))
            OutlinedTextField(displayName, onDisplayName, Modifier.fillMaxWidth(), label = { Text("Full name") }, singleLine = true)
            Text("Account type")
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                FilterChip(role == "candidate", { onRole("candidate") }, label = { Text("Candidate") })
                FilterChip(role == "recruiter", { onRole("recruiter") }, label = { Text("Recruiter") })
            }
            if (role == "recruiter") {
                OutlinedTextField(companyName, onCompanyName, Modifier.fillMaxWidth(), label = { Text("Company name") })
                OutlinedTextField(companySector, onCompanySector, Modifier.fillMaxWidth(), label = { Text("Company sector") })
            }
            Text(
                "Privacy notice: AdoptAJob processes account details, profile/background information, skills and preferences, card interactions (likes, passes and flags), matches and related communications to operate accounts and provide job-discovery and recruitment features. Account data is retained until account deletion or 12 months of inactivity; CVs until the match ends or the account is deleted; reports for 12 months after creation. This is the project's draft notice; the project privacy owner must confirm the controller/contact details and legal basis before production.",
                style = MaterialTheme.typography.bodySmall
            )
            Row(verticalAlignment = Alignment.CenterVertically) {
                Checkbox(ageConfirmed, onAgeConfirmed)
                Text("I confirm that I meet the age requirement.")
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Checkbox(privacyAccepted, onPrivacyAccepted)
                Text("I have read and accept the privacy notice.")
            }
        }
        message?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        Spacer(Modifier.height(12.dp))
        Button(onClick = onSubmit, enabled = !loading && email.isNotBlank() && password.length >= 8, modifier = Modifier.fillMaxWidth()) {
            Text(if (loading) "Please wait…" else if (register) "Create account" else "Sign in")
        }
        TextButton(onClick = { onRegister(!register) }, modifier = Modifier.align(Alignment.CenterHorizontally)) {
            Text(if (register) "Already have an account? Sign in" else "New here? Create an account")
        }
    }
}

@Composable
private fun CandidateFeed(cards: List<JobCard>, loading: Boolean, message: String?, onRefresh: () -> Unit, onSwipe: (JobCard, String) -> Unit) {
    Column(Modifier.fillMaxSize()) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            Text("Your feed", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.SemiBold)
            TextButton(onClick = onRefresh) { Text("Refresh") }
        }
        if (loading) LinearProgressIndicator(Modifier.fillMaxWidth())
        if (cards.isEmpty()) Notice(message ?: "No opportunities yet. Refresh after the backend is running.")
        else {
            val card = cards.first()
            Card(Modifier.fillMaxWidth().weight(1f), shape = RoundedCornerShape(24.dp)) {
                Column(Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.SpaceBetween) {
                    Column {
                        Text(card.kind, color = MaterialTheme.colorScheme.primary)
                        Spacer(Modifier.height(8.dp))
                        Text(card.title, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
                        Text(card.companyName, style = MaterialTheme.typography.titleMedium)
                        Text(card.sector)
                        Spacer(Modifier.height(12.dp))
                        Text(card.description)
                        Spacer(Modifier.height(10.dp))
                        Text(card.location)
                        Text(card.contractType)
                        Text(card.tags.joinToString(" • "))
                        card.salaryRange?.let { Text(it) }
                        card.matchScore?.let { Text("Match score: $it") }
                    }
                }
            }
            Spacer(Modifier.height(12.dp))
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedButton(onClick = { onSwipe(card, "PASS") }, Modifier.weight(1f), enabled = !loading) { Text("Pass") }
                Button(onClick = { onSwipe(card, "LIKE") }, Modifier.weight(1f), enabled = !loading) { Text("Like") }
            }
        }
    }
}

@Composable
private fun CandidateProfileScreen(api: ApiClient, token: String?, onError: (Throwable) -> Unit) {
    var displayName by remember { mutableStateOf("") }
    var desiredRoles by remember { mutableStateOf("") }
    var skills by remember { mutableStateOf("") }
    var education by remember { mutableStateOf("") }
    var experience by remember { mutableStateOf("0") }
    var locations by remember { mutableStateOf("") }
    var contract by remember { mutableStateOf("Full-time") }
    var status by remember { mutableStateOf("Loading profile…") }
    val scope = rememberCoroutineScope()
    LaunchedEffect(token) {
        try {
            val p = api.get<CandidateProfileResponse>("candidate/profile", token).profile
            displayName = p.displayName; desiredRoles = p.desiredRoles; skills = p.skills.joinToString(", ")
            education = p.educationLevel; experience = p.experienceYears; locations = p.preferredLocations
            contract = p.contractType; status = "Profile loaded."
        } catch (t: Throwable) { status = t.message ?: "Profile not available yet." }
    }
    LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        item { Text("Your profile", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold) }
        item { OutlinedTextField(displayName, { displayName = it }, Modifier.fillMaxWidth(), label = { Text("Display name") }) }
        item { OutlinedTextField(desiredRoles, { desiredRoles = it }, Modifier.fillMaxWidth(), label = { Text("Desired roles") }) }
        item { OutlinedTextField(skills, { skills = it }, Modifier.fillMaxWidth(), label = { Text("Skills (comma-separated)") }) }
        item { OutlinedTextField(education, { education = it }, Modifier.fillMaxWidth(), label = { Text("Education level") }) }
        item { OutlinedTextField(experience, { experience = it }, Modifier.fillMaxWidth(), label = { Text("Years of experience") }) }
        item { OutlinedTextField(locations, { locations = it }, Modifier.fillMaxWidth(), label = { Text("Preferred locations") }) }
        item { OutlinedTextField(contract, { contract = it }, Modifier.fillMaxWidth(), label = { Text("Contract type") }) }
        item { Text(status) }
        item {
            Button(onClick = {
                scope.launch {
                    try {
                        api.put<Unit>("candidate/profile", CandidateProfileInput(
                            displayName, desiredRoles, skills.split(",").map { it.trim() }.filter { it.isNotEmpty() },
                            education, experience, locations, contract
                        ), token)
                        status = "Profile saved."
                    } catch (t: Throwable) { onError(t); status = t.message ?: "Save failed." }
                }
            }) { Text("Save profile") }
        }
    }
}

@Composable
private fun RecruiterScreen(api: ApiClient, token: String?, onError: (Throwable) -> Unit) {
    var cards by remember { mutableStateOf<List<JobCard>>(emptyList()) }
    var interested by remember { mutableStateOf<List<InterestedSwipe>>(emptyList()) }
    var company by remember { mutableStateOf("") }
    var sector by remember { mutableStateOf("") }
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var location by remember { mutableStateOf("") }
    var contract by remember { mutableStateOf("Full-time") }
    var tags by remember { mutableStateOf("") }
    var status by remember { mutableStateOf("Loading recruiter workspace…") }
    val scope = rememberCoroutineScope()
    suspend fun refresh() {
        try {
            cards = api.get<JobCardsResponse>("recruiter/cards", token).cards
            interested = api.get<InterestedResponse>("recruiter/interested", token).swipes
            status = "Loaded ${cards.size} cards and ${interested.size} interested candidates."
        } catch (t: Throwable) { status = t.message ?: "Recruiter data could not be loaded."; onError(t) }
    }
    LaunchedEffect(token) { refresh() }
    LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        item { Text("Recruiter workspace", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold) }
        item { Text(status, style = MaterialTheme.typography.bodySmall) }
        item { Text("Create a job card", style = MaterialTheme.typography.titleMedium) }
        item { OutlinedTextField(company, { company = it }, Modifier.fillMaxWidth(), label = { Text("Company name") }) }
        item { OutlinedTextField(sector, { sector = it }, Modifier.fillMaxWidth(), label = { Text("Sector") }) }
        item { OutlinedTextField(title, { title = it }, Modifier.fillMaxWidth(), label = { Text("Job title") }) }
        item { OutlinedTextField(description, { description = it }, Modifier.fillMaxWidth(), label = { Text("Description") }, minLines = 3) }
        item { OutlinedTextField(location, { location = it }, Modifier.fillMaxWidth(), label = { Text("Location") }) }
        item { OutlinedTextField(contract, { contract = it }, Modifier.fillMaxWidth(), label = { Text("Contract type") }) }
        item { OutlinedTextField(tags, { tags = it }, Modifier.fillMaxWidth(), label = { Text("Tags (comma-separated)") }) }
        item {
            Button(enabled = title.isNotBlank() && description.isNotBlank() && company.isNotBlank() && sector.isNotBlank() && location.isNotBlank() && tags.isNotBlank(),
                onClick = { scope.launch {
                    try {
                        val result = api.post<JobCardResponse>("recruiter/cards", JobCardInput(
                            "JOB", company, sector, title, description, location, contract,
                            tags.split(",").map { it.trim() }.filter { it.isNotEmpty() }, null, null
                        ), token)
                        cards = cards + result.card
                        status = "Card created."
                    } catch (t: Throwable) { onError(t); status = t.message ?: "Create failed." }
                } }) { Text("Publish job card") }
        }
        item { Text("Interested candidates", style = MaterialTheme.typography.titleMedium) }
        items(interested, key = { it.id }) { swipe ->
            Card {
                Column(Modifier.fillMaxWidth().padding(12.dp)) {
                    Text(swipe.candidateDisplayName, fontWeight = FontWeight.Bold)
                    Text("Skills: ${swipe.candidateSkills.joinToString(", ")}")
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Button(onClick = { scope.launch {
                            try { api.post<Unit>("recruiter/interested/${swipe.id}/decision", DecisionRequest("ACCEPT"), token); interested = interested.filterNot { it.id == swipe.id } }
                            catch (t: Throwable) { onError(t) }
                        } }) { Text("Accept") }
                        OutlinedButton(onClick = { scope.launch {
                            try { api.post<Unit>("recruiter/interested/${swipe.id}/decision", DecisionRequest("DECLINE"), token); interested = interested.filterNot { it.id == swipe.id } }
                            catch (t: Throwable) { onError(t) }
                        } }) { Text("Decline") }
                    }
                }
            }
        }
        item { Text("Your cards", style = MaterialTheme.typography.titleMedium) }
        items(cards, key = { it.id }) { c ->
            Card { Column(Modifier.padding(12.dp)) {
                Text(c.title, fontWeight = FontWeight.Bold); Text(c.companyName); Text(c.description); Text(c.location)
            } }
        }
    }
}

@Composable
private fun MatchesScreen(api: ApiClient, token: String?, onError: (Throwable) -> Unit) {
    var matches by remember { mutableStateOf<List<MatchRecord>>(emptyList()) }
    var status by remember { mutableStateOf("Loading matches…") }
    LaunchedEffect(token) {
        try { matches = api.get<MatchesResponse>("matches", token).matches; status = if (matches.isEmpty()) "No matches yet." else "" }
        catch (t: Throwable) { status = t.message ?: "Matches are not available."; onError(t) }
    }
    LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        item { Text("Your matches", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold) }
        if (status.isNotBlank()) item { Text(status) }
        items(matches, key = { it.id }) { m ->
            Card { Column(Modifier.padding(12.dp)) {
                Text("Match ${m.id}", fontWeight = FontWeight.Bold)
                Text("Card: ${m.cardId}")
                Text("Status: ${m.status}")
                Text(m.createdAt)
            } }
        }
    }
}

@Composable
private fun Notice(text: String) {
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text(text, style = MaterialTheme.typography.bodyLarge)
    }
}
