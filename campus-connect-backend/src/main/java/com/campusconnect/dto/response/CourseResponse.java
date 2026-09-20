package com.campusconnect.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Response DTO for course details.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CourseResponse {

    private Long id;
    private String courseCode;
    private String courseName;
    private String description;
    private String department;
    private Integer semester;
    private Integer credits;

    // Faculty information (if assigned)
    private Long facultyId;
    private String facultyName;
    private String facultyEmail;
    private String facultyDesignation;

    // Enrollment metrics
    private Long enrolledStudentsCount;
    private Boolean isEnrolled; // true if requesting student is already enrolled

    private LocalDateTime createdAt;
}
