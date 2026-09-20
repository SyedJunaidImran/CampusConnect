package com.campusconnect.dto.response.analytics;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentSubmissionStatsDto {
    private long totalAssignments;
    private long totalSubmissions;
    private long gradedCount;
    private long submittedCount; // pending grading
    private long lateCount;
    private double submissionRate; // percentage
    private double completionRate; // percentage
}
