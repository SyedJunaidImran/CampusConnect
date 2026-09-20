package com.campusconnect.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO returned after successful login or registration.
 *
 * Contains the JWT token and basic user info that the React frontend
 * needs to store in AuthContext and localStorage.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class JwtAuthResponse {

    private String accessToken;
    private String tokenType = "Bearer"; // Always "Bearer" for JWT
    private String role;
    private String fullName;
    private String email;

    /**
     * Convenience constructor — tokenType defaults to "Bearer".
     */
    public JwtAuthResponse(String accessToken, String role, String fullName, String email) {
        this.accessToken = accessToken;
        this.tokenType = "Bearer";
        this.role = role;
        this.fullName = fullName;
        this.email = email;
    }
}
