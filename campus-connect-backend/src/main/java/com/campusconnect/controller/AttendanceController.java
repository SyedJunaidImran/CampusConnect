package com.campusconnect.controller;

import com.campusconnect.dto.request.AttendanceUpdateRequest;
import com.campusconnect.dto.request.BatchAttendanceRequest;
import com.campusconnect.dto.response.ApiResponse;
import com.campusconnect.dto.response.AttendanceResponse;
import com.campusconnect.dto.response.DateAttendanceSheetResponse;
import com.campusconnect.dto.response.StudentOverallAttendanceResponse;
import com.campusconnect.entity.User;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.service.AttendanceService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * AttendanceController — REST endpoints for Student attendance summaries and Faculty/Admin attendance marking.
 */
@RestController
@RequestMapping("/api/attendance")
public class AttendanceController {

    private final AttendanceService attendanceService;
    private final UserRepository userRepository;

    public AttendanceController(AttendanceService attendanceService, UserRepository userRepository) {
        this.attendanceService = attendanceService;
        this.userRepository = userRepository;
    }

    /**
     * POST /api/attendance/batch
     * Faculty (or Admin) submits batch attendance for a class on a date.
     */
    @PostMapping("/batch")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    public ResponseEntity<ApiResponse<DateAttendanceSheetResponse>> submitBatchAttendance(
            @Valid @RequestBody BatchAttendanceRequest request,
            Authentication authentication) {
        User user = getUser(authentication.getName());
        DateAttendanceSheetResponse response = attendanceService.submitBatchAttendance(user.getEmail(), user.getRole(), request);
        return new ResponseEntity<>(
                ApiResponse.success("Attendance marked successfully", response),
                HttpStatus.CREATED
        );
    }

    /**
     * PUT /api/attendance/{id}
     * Update a single attendance record (e.g. adjust PRESENT/ABSENT).
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    public ResponseEntity<ApiResponse<AttendanceResponse>> updateAttendanceRecord(
            @PathVariable Long id,
            @Valid @RequestBody AttendanceUpdateRequest request,
            Authentication authentication) {
        User user = getUser(authentication.getName());
        AttendanceResponse response = attendanceService.updateAttendanceRecord(user.getEmail(), user.getRole(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Attendance record updated", response));
    }

    /**
     * GET /api/attendance/course/{courseId}/date/{date}
     * Get attendance sheet for a course on a date (includes all enrolled students).
     */
    @GetMapping("/course/{courseId}/date/{date}")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    public ResponseEntity<ApiResponse<DateAttendanceSheetResponse>> getCourseAttendanceOnDate(
            @PathVariable Long courseId,
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            Authentication authentication) {
        User user = getUser(authentication.getName());
        DateAttendanceSheetResponse sheet = attendanceService.getCourseAttendanceOnDate(user.getEmail(), user.getRole(), courseId, date);
        return ResponseEntity.ok(ApiResponse.success("Attendance sheet retrieved", sheet));
    }

    /**
     * GET /api/attendance/course/{courseId}/dates
     * Get distinct dates on which attendance was taken for a course (Faculty for assigned course, Admin for any).
     */
    @GetMapping("/course/{courseId}/dates")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<LocalDate>>> getCourseAttendanceDates(
            @PathVariable Long courseId,
            Authentication authentication) {
        User user = getUser(authentication.getName());
        List<LocalDate> dates = attendanceService.getCourseAttendanceDates(courseId, user.getEmail(), user.getRole());
        return ResponseEntity.ok(ApiResponse.success("Attendance dates retrieved", dates));
    }

    /**
     * GET /api/attendance/my
     * Get logged-in student's overall & course-wise attendance summary.
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<StudentOverallAttendanceResponse>> getMyAttendance(
            Authentication authentication) {
        StudentOverallAttendanceResponse response = attendanceService.getStudentOverallAttendance(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Student attendance retrieved", response));
    }

    /**
     * GET /api/attendance/my/course/{courseId}
     * Get logged-in student's date-by-date attendance records for a course.
     */
    @GetMapping("/my/course/{courseId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<AttendanceResponse>>> getMyCourseAttendanceHistory(
            @PathVariable Long courseId,
            Authentication authentication) {
        List<AttendanceResponse> records = attendanceService.getStudentCourseAttendanceHistory(authentication.getName(), courseId);
        return ResponseEntity.ok(ApiResponse.success("Course attendance history retrieved", records));
    }

    /**
     * GET /api/attendance/student/{studentId}
     * Get attendance summary for a student by studentId (Faculty for own students, or Admin).
     */
    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    public ResponseEntity<ApiResponse<StudentOverallAttendanceResponse>> getStudentAttendanceById(
            @PathVariable Long studentId,
            Authentication authentication) {
        User user = getUser(authentication.getName());
        StudentOverallAttendanceResponse response = attendanceService.getStudentAttendanceById(studentId, user.getEmail(), user.getRole());
        return ResponseEntity.ok(ApiResponse.success("Student attendance summary retrieved", response));
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }
}
