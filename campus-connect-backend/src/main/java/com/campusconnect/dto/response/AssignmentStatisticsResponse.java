package com.campusconnect.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Response DTO for assignment submission statistics.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AssignmentStatisticsResponse {

    private Long assignmentId;
    private String assignmentTitle;
    private Long totalEnrolledStudents;
    private Long submitted;
    private Long notSubmitted;
    private Long late;
    private Long graded;
}
