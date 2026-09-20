package com.campusconnect.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Response DTO for assignment submission details.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AssignmentSubmissionResponse {

    private Long id;

    // Assignment information
    private Long assignmentId;
    private String assignmentTitle;
    private Integer totalMarks;

    // Student information
    private Long studentId;
    private String studentName;
    private String rollNumber;

    // Submission details
    private String submissionText;
    private LocalDateTime submittedAt;
    private LocalDateTime updatedAt;

    // Grading
    private Integer marks;
    private String feedback;
    private String status;

    // Course context
    private String courseCode;
    private String courseName;
}
