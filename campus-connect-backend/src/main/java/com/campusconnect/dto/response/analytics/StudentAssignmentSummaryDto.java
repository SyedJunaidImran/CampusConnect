package com.campusconnect.dto.response.analytics;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StudentAssignmentSummaryDto {
    private Long assignmentId;
    private String title;
    private String courseCode;
    private String courseName;
    private LocalDateTime dueDate;
    private Integer totalMarks;
    private Integer marksObtained;
    private String status; // NOT_SUBMITTED, SUBMITTED, GRADED, LATE
    private LocalDateTime submittedAt;
    private boolean isPastDue;
}
