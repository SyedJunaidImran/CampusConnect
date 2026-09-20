package com.campusconnect.dto.request;

import com.campusconnect.enums.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO for updating a single existing attendance record's status.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceUpdateRequest {

    @NotNull(message = "Attendance status is required (PRESENT or ABSENT)")
    private AttendanceStatus status;
}
