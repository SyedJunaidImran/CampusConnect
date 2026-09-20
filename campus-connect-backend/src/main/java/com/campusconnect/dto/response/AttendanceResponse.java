package com.campusconnect.dto.response;

import com.campusconnect.enums.AttendanceStatus;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Response DTO for a single attendance record.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AttendanceResponse {

    private Long id;

    // Student details
    private Long studentId;
    private String studentName;
    private String studentRollNumber;
    private String studentDepartment;

    // Course details
    private Long courseId;
    private String courseCode;
    private String courseName;

    // Attendance info
    private LocalDate attendanceDate;
    private AttendanceStatus status;
    private LocalDateTime markedAt;
    private LocalDateTime updatedAt;
}
