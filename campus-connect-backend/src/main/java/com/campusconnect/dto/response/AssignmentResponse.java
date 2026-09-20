package com.campusconnect.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Response DTO for assignment details.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AssignmentResponse {

    private Long id;
    private String title;
    private String description;

    // Course information
    private Long courseId;
    private String courseCode;
    private String courseName;

    // Faculty information
    private Long facultyId;
    private String facultyName;

    private LocalDateTime dueDate;
    private Integer totalMarks;
    private Boolean isOverdue;

    // Submission status for the requesting student (null for faculty/admin)
    private String submissionStatus;
    private Integer obtainedMarks;

    // Statistics (for faculty/admin)
    private Long submissionCount;

    private LocalDateTime createdAt;
}
