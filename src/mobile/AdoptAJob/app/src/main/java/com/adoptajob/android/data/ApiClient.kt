package com.adoptajob.android.data

import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.IOException
import java.net.HttpURLConnection
import java.net.SocketTimeoutException
import java.net.URL

class ApiClient(@PublishedApi internal val baseUrl: String) {
    @PublishedApi internal val gson = Gson()

    suspend inline fun <reified T> get(path: String, token: String? = null): T =
        request("GET", path, null, token)

    suspend inline fun <reified T> post(
        path: String, body: Any, token: String? = null,
        headers: Map<String, String> = emptyMap()
    ): T = request("POST", path, body, token, headers)

    suspend inline fun <reified T> put(path: String, body: Any, token: String? = null): T =
        request("PUT", path, body, token)

    suspend inline fun <reified T> postEmpty(path: String, token: String? = null): T =
        request("POST", path, null, token)

    @PublishedApi
    internal suspend inline fun <reified T> request(
        method: String, path: String, body: Any?, token: String?,
        headers: Map<String, String> = emptyMap()
    ): T = withContext(Dispatchers.IO) {
        val target = URL(baseUrl.trimEnd('/') + "/" + path.trimStart('/'))
        val connection = try {
            target.openConnection() as HttpURLConnection
        } catch (e: Exception) {
            throw ApiException(0, "Cannot reach the AdoptAJob server. Check the API address and make sure Fastify is running.")
        }
        try {
            connection.requestMethod = method
            connection.connectTimeout = 8_000
            connection.readTimeout = 15_000
            connection.setRequestProperty("Accept", "application/json")
            if (body != null) {
                connection.doOutput = true
                connection.setRequestProperty("Content-Type", "application/json")
                connection.outputStream.use { it.write(gson.toJson(body).toByteArray(Charsets.UTF_8)) }
            }
            token?.let { connection.setRequestProperty("Authorization", "Bearer $it") }
            headers.forEach { (key, value) -> connection.setRequestProperty(key, value) }
            val code = connection.responseCode
            val stream = if (code in 200..299) connection.inputStream else connection.errorStream
            val response = stream?.bufferedReader(Charsets.UTF_8)?.use { it.readText() }.orEmpty()
            if (code !in 200..299) {
                val parsed = runCatching { gson.fromJson(response, ApiError::class.java) }.getOrNull()
                val message = parsed?.message?.takeIf { it.isNotBlank() }
                    ?: when (code) {
                        401 -> "Your session has expired. Please sign in again."
                        403 -> "You do not have permission to perform this action."
                        404 -> "This feature is not available on the backend yet."
                        501 -> "The backend route is not implemented yet. Please contact the backend developer."
                        503 -> "The AdoptAJob server is temporarily unavailable. Please try again shortly."
                        else -> "The server returned an error (HTTP $code). Please try again."
                    }
                throw ApiException(code, message)
            }
            if (T::class == Unit::class) {
                Unit as T
            } else {
                val type = object : TypeToken<T>() {}.type
                gson.fromJson<T>(response, type)
            }
        } catch (e: SocketTimeoutException) {
            throw ApiException(0, "The AdoptAJob server took too long to respond. Check that Fastify is running on the configured port.")
        } catch (e: IOException) {
            throw ApiException(0, "Cannot connect to the AdoptAJob server. Start the Fastify backend and verify the API URL and port.")
        } finally {
            connection.disconnect()
        }
    }
}

class ApiException(val status: Int, override val message: String) : Exception(message)
