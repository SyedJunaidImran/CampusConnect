package com.campusconnect.dto.response.analytics;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CourseEnrollmentStatDto {
    private Long courseId;
    private String courseCode;
    private String courseName;
    private String department;
    private Integer semester;
    private long enrolledCount;
    private String facultyName;
    private double attendancePercentage;
    private long assignmentCount;
}
