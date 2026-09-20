package com.campusconnect.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO for returning user profile information via GET /api/auth/me.
 *
 * Notice: this does NOT include the password field.
 * This is exactly WHY we use DTOs — we control what gets sent to the client.
 * The User entity has a password field, but UserResponse does not.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserResponse {

    private Long id;
    private String email;
    private String fullName;
    private String role;

    // Student-specific fields (null for non-students)
    private String rollNumber;
    private String department;
    private Integer semester;
    private Integer yearOfAdmission;
    private String phone;

    // Faculty-specific fields (null for non-faculty)
    private String employeeId;
    private String designation;
}
