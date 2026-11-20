package com.adoptajob.android

import com.adoptajob.android.data.LoginRequest
import com.adoptajob.android.data.RegisterRequest
import com.adoptajob.android.data.SwipeRequest
import com.google.gson.Gson
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ContractTests {
    private val gson = Gson()

    @Test
    fun registrationIncludesRequiredPrivacyAndAgeConsentFields() {
        val json = gson.toJson(RegisterRequest(
            email = "candidate@example.org",
            password = "password123",
            role = "candidate",
            displayName = "Demo Candidate",
            ageConfirmed = true,
            privacyAccepted = true
        ))
        assertTrue(json.contains("\"displayName\":\"Demo Candidate\""))
        assertTrue(json.contains("\"ageConfirmed\":true"))
        assertTrue(json.contains("\"privacyAccepted\":true"))
        assertTrue(json.contains("\"role\":\"candidate\""))
    }

    @Test
    fun loginUsesContractEmailAndPasswordKeys() {
        val json = gson.toJson(LoginRequest("candidate@example.org", "password123"))
        assertEquals("{\"email\":\"candidate@example.org\",\"password\":\"password123\"}", json)
    }

    @Test
    fun swipeUsesCamelCaseCardIdAndUppercaseAction() {
        val json = gson.toJson(SwipeRequest("card_001", "LIKE"))
        assertEquals("{\"cardId\":\"card_001\",\"action\":\"LIKE\"}", json)
    }
}
