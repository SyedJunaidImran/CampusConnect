package com.campusconnect.security;

import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory brute-force protection service for authentication.
 *
 * Tracks consecutive failed login attempts per user identity (email).
 * Automatically locks the identity for 15 minutes after 5 failed attempts
 * and resets cleanly upon successful authentication.
 */
@Service
public class LoginAttemptService {

    public static final int MAX_ATTEMPTS = 5;
    public static final long LOCK_DURATION_MS = 15 * 60 * 1000L; // 15 minutes

    private static class Attempt {
        int count;
        long lastModified;

        Attempt(int count, long lastModified) {
            this.count = count;
            this.lastModified = lastModified;
        }
    }

    private final Map<String, Attempt> attemptsCache = new ConcurrentHashMap<>();

    /**
     * Record a successful login — clears any existing failure history.
     */
    public void loginSucceeded(String key) {
        if (key != null) {
            attemptsCache.remove(key.toLowerCase().trim());
        }
    }

    /**
     * Record a failed login attempt.
     */
    public void loginFailed(String key) {
        if (key == null || key.isBlank()) {
            return;
        }
        String normalized = key.toLowerCase().trim();
        long now = System.currentTimeMillis();

        attemptsCache.compute(normalized, (k, attempt) -> {
            if (attempt == null || (now - attempt.lastModified) > LOCK_DURATION_MS) {
                return new Attempt(1, now);
            } else {
                attempt.count++;
                attempt.lastModified = now;
                return attempt;
            }
        });
    }

    /**
     * Check if a given key is currently locked out.
     */
    public boolean isBlocked(String key) {
        if (key == null || key.isBlank()) {
            return false;
        }
        String normalized = key.toLowerCase().trim();
        Attempt attempt = attemptsCache.get(normalized);
        if (attempt == null) {
            return false;
        }

        long now = System.currentTimeMillis();
        if ((now - attempt.lastModified) > LOCK_DURATION_MS) {
            attemptsCache.remove(normalized);
            return false;
        }

        return attempt.count >= MAX_ATTEMPTS;
    }

    /**
     * Get remaining lockout duration in minutes (rounded up).
     */
    public int getRemainingLockMinutes(String key) {
        if (key == null || key.isBlank()) {
            return 0;
        }
        String normalized = key.toLowerCase().trim();
        Attempt attempt = attemptsCache.get(normalized);
        if (attempt == null) {
            return 0;
        }

        long elapsed = System.currentTimeMillis() - attempt.lastModified;
        long remaining = LOCK_DURATION_MS - elapsed;
        if (remaining <= 0) {
            attemptsCache.remove(normalized);
            return 0;
        }

        return (int) Math.ceil((double) remaining / 60000.0);
    }
}
