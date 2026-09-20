package com.campusconnect.dto.response.analytics;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StudentCourseAttendanceDto {
    private Long courseId;
    private String courseCode;
    private String courseName;
    private String facultyName;
    private long totalClasses;
    private long attendedClasses;
    private long missedClasses;
    private double attendancePercentage;
    private boolean isBelowThreshold;
}
