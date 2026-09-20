package com.campusconnect.dto.request;

import com.campusconnect.enums.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Individual student attendance entry in a batch attendance submission.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceRecordRequest {

    @NotNull(message = "Student ID is required")
    private Long studentId;

    @NotNull(message = "Attendance status is required (PRESENT or ABSENT)")
    private AttendanceStatus status;
}
