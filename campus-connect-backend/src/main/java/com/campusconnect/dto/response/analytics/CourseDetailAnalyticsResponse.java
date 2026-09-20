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
public class CourseDetailAnalyticsResponse {
    private Long courseId;
    private String courseCode;
    private String courseTitle;
    private String department;
    private Integer semester;
    private Integer credits;
    private String facultyName;

    // Enrollment & Attendance
    private long enrolledStudentsCount;
    private long totalClassesHeld;
    private long totalAttendanceMarks;
    private long totalPresentMarks;
    private long totalAbsentMarks;
    private double averageAttendancePercentage;

    // At-risk students (< 75%)
    private List<StudentAttendanceShortageDto> studentsBelowThreshold;

    // All enrolled student attendance (for printable/exportable report)
    private List<StudentAttendanceShortageDto> studentAttendanceReport;

    // Assignment breakdown
    private CourseAssignmentStatsDto assignmentStats;
    private long studyMaterialsCount;
}
