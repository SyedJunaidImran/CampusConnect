package com.campusconnect.dto.response.analytics;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StudentAttendanceShortageDto {
    private Long studentId;
    private String studentName;
    private String rollNumber;
    private String department;
    private long totalClasses;
    private long attendedClasses;
    private long missedClasses;
    private double attendancePercentage;
    private boolean isBelowThreshold; // true if < 75%
}
