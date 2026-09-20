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
public class StudentAnalyticsResponse {
    private Long studentId;
    private String studentName;
    private String rollNumber;
    private String department;
    private Integer semester;

    private long enrolledCoursesCount;
    private double overallAttendancePercentage;
    private long totalClassesHeld;
    private long totalClassesAttended;
    private long totalClassesMissed;
    private boolean hasAttendanceShortage;
    private long shortageCoursesCount;

    private List<StudentCourseAttendanceDto> courseAttendance;

    // Assignment stats
    private long totalAssignments;
    private long submittedAssignmentsCount;
    private long gradedAssignmentsCount;
    private long pendingAssignmentsCount;
    private long lateAssignmentsCount;
    private double assignmentCompletionRate;
    private Double averageGradePercentage;

    private List<StudentAssignmentSummaryDto> assignments;
    private long studyMaterialsAvailableCount;
    private long announcementsCount;
}
