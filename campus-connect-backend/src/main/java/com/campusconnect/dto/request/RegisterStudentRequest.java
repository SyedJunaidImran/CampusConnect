package com.campusconnect.dto.request;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO for student registration requests.
 *
 * Contains both User fields (email, password, name) and Student-specific
 * fields (roll number, department, semester).
 *
 * The service layer will split this into a User entity + Student entity.
 */
@Getter
@Setter
@NoArgsConstructor
public class RegisterStudentRequest {

    // ---- User fields ----

    @NotBlank(message = "Full name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String fullName;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 40, message = "Password must be between 6 and 40 characters")
    private String password;

    // ---- Student-specific fields ----

    @NotBlank(message = "Roll number is required")
    @Size(max = 20, message = "Roll number must be at most 20 characters")
    private String rollNumber;

    @NotBlank(message = "Department is required")
    @Size(max = 50, message = "Department must be at most 50 characters")
    private String department;

    @NotNull(message = "Semester is required")
    @Min(value = 1, message = "Semester must be at least 1")
    @Max(value = 8, message = "Semester must be at most 8")
    private Integer semester;

    @NotNull(message = "Year of admission is required")
    @Min(value = 2000, message = "Year of admission must be 2000 or later")
    private Integer yearOfAdmission;

    @Size(max = 15, message = "Phone number must be at most 15 characters")
    private String phone; // optional
}
