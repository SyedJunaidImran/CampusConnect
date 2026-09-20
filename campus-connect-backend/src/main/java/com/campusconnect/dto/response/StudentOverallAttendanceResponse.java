package com.campusconnect.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * Aggregated attendance overview for a student across all enrolled subjects.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class StudentOverallAttendanceResponse {

    private Long studentId;
    private String fullName;
    private String rollNumber;
    private String department;
    private Integer semester;

    private long totalClassesAllCourses;
    private long totalAttendedAllCourses;
    private long totalMissedAllCourses;
    private double overallAttendancePercentage;
    private boolean hasLowAttendanceWarning; // true if overall or any course < 75%

    private List<CourseAttendanceSummaryResponse> courseSummaries;
    private List<AttendanceResponse> recentAttendanceRecords;
}
