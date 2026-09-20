package com.campusconnect.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

/**
 * Attendance sheet for a class on a specific date (used by Faculty and Admin).
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class DateAttendanceSheetResponse {

    private Long courseId;
    private String courseCode;
    private String courseName;
    private LocalDate attendanceDate;

    private int totalEnrolled;
    private int presentCount;
    private int absentCount;
    private double dailyAttendancePercentage;

    private List<AttendanceResponse> records;
}
