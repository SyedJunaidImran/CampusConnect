package com.campusconnect.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Attendance summary metrics for a student in a specific course.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CourseAttendanceSummaryResponse {

    private Long courseId;
    private String courseCode;
    private String courseName;
    private String department;
    private Integer semester;
    private Integer credits;
    private String facultyName;

    private long totalClasses;
    private long attendedClasses; // PRESENT count
    private long missedClasses;   // ABSENT count
    private double attendancePercentage; // (attended / total) * 100
    private boolean lowAttendanceWarning; // true if percentage < 75.0% and totalClasses > 0
}
