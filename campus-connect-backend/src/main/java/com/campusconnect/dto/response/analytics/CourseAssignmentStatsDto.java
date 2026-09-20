package com.campusconnect.dto.response.analytics;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CourseAssignmentStatsDto {
    private long totalAssignments;
    private long expectedSubmissions;
    private long actualSubmissions;
    private double submissionRate;
    private long gradedCount;
    private long pendingGradingCount;
    private long lateCount;
    private Double averageMarks;
}
