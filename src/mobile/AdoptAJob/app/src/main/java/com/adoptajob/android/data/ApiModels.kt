package com.adoptajob.android.data

data class UserSummary(
    val id: String,
    val email: String,
    val role: String,
    val displayName: String,
    val companyName: String? = null,
    val companySector: String? = null
)
data class AuthResponse(val user: UserSummary, val token: String)
data class MeResponse(val user: UserSummary)
data class LoginRequest(val email: String, val password: String)
data class RegisterRequest(
    val email: String,
    val password: String,
    val role: String,
    val displayName: String,
    val ageConfirmed: Boolean,
    val privacyAccepted: Boolean,
    val companyName: String? = null,
    val companySector: String? = null
)
data class CandidateProfile(
    val displayName: String,
    val desiredRoles: String,
    val skills: List<String>,
    val educationLevel: String,
    val experienceYears: String,
    val preferredLocations: String,
    val contractType: String
)
data class CandidateProfileResponse(val profile: CandidateProfile)
data class CandidateProfileInput(
    val displayName: String,
    val desiredRoles: String,
    val skills: List<String>,
    val educationLevel: String,
    val experienceYears: String,
    val preferredLocations: String,
    val contractType: String
)
data class JobCard(
    val id: String,
    val kind: String,
    val companyName: String,
    val sector: String,
    val title: String,
    val description: String,
    val location: String = "",
    val contractType: String = "",
    val tags: List<String> = emptyList(),
    val salaryRange: String? = null,
    val perks: String? = null,
    val published: Boolean = true,
    val createdAt: String = "",
    val matchScore: Int? = null
)
data class JobCardInput(
    val kind: String,
    val companyName: String,
    val sector: String,
    val title: String,
    val description: String,
    val location: String,
    val contractType: String,
    val tags: List<String>,
    val salaryRange: String? = null,
    val perks: String? = null
)
data class FeedResponse(val cards: List<JobCard>)
data class JobCardsResponse(val cards: List<JobCard>)
data class JobCardResponse(val card: JobCard)
data class SwipeRequest(val cardId: String, val action: String)
data class InterestedSwipe(
    val id: String,
    val candidateDisplayName: String,
    val candidateSkills: List<String>,
    val cardId: String,
    val createdAt: String
)
data class InterestedResponse(val swipes: List<InterestedSwipe>)
data class DecisionRequest(val decision: String)
data class MatchRecord(
    val id: String,
    val candidateEmail: String? = null,
    val cardId: String,
    val recruiterEmail: String? = null,
    val createdAt: String,
    val status: String
)
data class MatchesResponse(val matches: List<MatchRecord>)
data class ApiError(val code: String?, val message: String?)
