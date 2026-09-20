package com.campusconnect.dto.response.analytics;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FacultyAnalyticsResponse {
    private Long facultyId;
    private String facultyName;
    private String department;
    private String employeeId;

    private long assignedCoursesCount;
    private long totalEnrolledStudents; // distinct count
    private long totalAssignmentsCreated;
    private long totalSubmissionsReceived;
    private long pendingGradingCount;
    private double overallAttendancePercentage;
    private long totalStudentsBelowThreshold;

    private List<CourseEnrollmentStatDto> courses;
    private CourseDetailAnalyticsResponse selectedCourseAnalytics;
}
