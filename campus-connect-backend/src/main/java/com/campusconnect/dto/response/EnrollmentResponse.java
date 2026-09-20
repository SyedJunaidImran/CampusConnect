package com.campusconnect.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Response DTO for course enrollment records.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class EnrollmentResponse {

    private Long id;

    // Student details
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private String studentRollNumber;
    private String studentDepartment;

    // Course details
    private Long courseId;
    private String courseCode;
    private String courseName;
    private String department;
    private Integer semester;
    private Integer credits;
    private String facultyName;

    private LocalDateTime enrolledAt;
}
