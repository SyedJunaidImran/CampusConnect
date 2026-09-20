package com.campusconnect.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Detailed response DTO for Student profiles.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StudentProfileResponse {

    private Long id; // Student ID
    private Long userId; // User ID
    private String email;
    private String fullName;
    private String role;

    private String rollNumber;
    private String department;
    private Integer semester;
    private Integer yearOfAdmission;
    private String phone;

    private Long enrolledCoursesCount;
    private LocalDateTime memberSince;
}
