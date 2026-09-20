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
public class AdminAnalyticsResponse {
    private long totalStudents;
    private long totalFaculty;
    private long totalCourses;
    private long totalEnrollments;
    private long totalAssignments;
    private long totalStudyMaterials;
    private long totalAnnouncements;
    private long totalMessages;

    // Attendance breakdown
    private double overallAttendancePercentage;
    private long totalAttendanceRecords;
    private long totalPresentRecords;
    private long totalAbsentRecords;

    // Assignment & Submission breakdown
    private AssignmentSubmissionStatsDto assignmentStats;

    // Distributions
    private List<CourseEnrollmentStatDto> courseEnrollments;
    private List<DepartmentStatDto> departmentStats;
    private List<RecentActivityDto> recentActivities;
}
