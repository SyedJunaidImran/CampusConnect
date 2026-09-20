package com.campusconnect.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

/**
 * DTO for faculty submitting batch attendance for a whole class on a given date.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BatchAttendanceRequest {

    @NotNull(message = "Course ID is required")
    private Long courseId;

    @NotNull(message = "Attendance date is required")
    private LocalDate attendanceDate;

    @NotEmpty(message = "At least one student attendance record is required")
    @Valid
    private List<AttendanceRecordRequest> records;
}
