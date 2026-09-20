package com.campusconnect.controller;

import com.campusconnect.dto.response.ApiResponse;
import com.campusconnect.dto.response.analytics.*;
import com.campusconnect.entity.User;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * AnalyticsController — REST endpoints for system-wide, instructor-course, and personal academic analytics.
 */
@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final UserRepository userRepository;

    public AnalyticsController(AnalyticsService analyticsService, UserRepository userRepository) {
        this.analyticsService = analyticsService;
        this.userRepository = userRepository;
    }

    /**
     * GET /api/analytics/admin
     * Global system metrics, course enrollments, attendance, and assignment completion for ADMIN.
     */
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<AdminAnalyticsResponse>> getAdminAnalytics() {
        AdminAnalyticsResponse response = analyticsService.getAdminAnalytics();
        return ResponseEntity.ok(ApiResponse.success("Admin analytics retrieved successfully", response));
    }

    /**
     * GET /api/analytics/faculty
     * Overview metrics across all courses taught by the authenticated faculty member.
     */
    @GetMapping("/faculty")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<ApiResponse<FacultyAnalyticsResponse>> getFacultyAnalytics(Authentication authentication) {
        User user = getUser(authentication.getName());
        FacultyAnalyticsResponse response = analyticsService.getFacultyAnalytics(user.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Faculty analytics retrieved successfully", response));
    }

    /**
     * GET /api/analytics/faculty/course/{courseId}
     * In-depth course analytics for an assigned course (enrolled students, attendance shortage list, assignment stats).
     */
    @GetMapping("/faculty/course/{courseId}")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    public ResponseEntity<ApiResponse<CourseDetailAnalyticsResponse>> getFacultyCourseAnalytics(
            @PathVariable Long courseId,
            Authentication authentication) {
        User user = getUser(authentication.getName());
        CourseDetailAnalyticsResponse response = analyticsService.getFacultyCourseAnalytics(user.getEmail(), user.getRole(), courseId);
        return ResponseEntity.ok(ApiResponse.success("Course analytics retrieved successfully", response));
    }

    /**
     * GET /api/analytics/student
     * Personal academic analytics for the authenticated student.
     */
    @GetMapping("/student")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<StudentAnalyticsResponse>> getStudentAnalytics(Authentication authentication) {
        User user = getUser(authentication.getName());
        StudentAnalyticsResponse response = analyticsService.getStudentAnalytics(user.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Student analytics retrieved successfully", response));
    }

    /**
     * GET /api/analytics/student/attendance
     * Detailed attendance breakdown by course for the authenticated student.
     */
    @GetMapping("/student/attendance")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<StudentCourseAttendanceDto>>> getStudentAttendanceAnalytics(Authentication authentication) {
        User user = getUser(authentication.getName());
        StudentAnalyticsResponse studentAnalytics = analyticsService.getStudentAnalytics(user.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Student attendance analytics retrieved successfully", studentAnalytics.getCourseAttendance()));
    }

    /**
     * GET /api/analytics/student/assignments
     * Detailed assignment status and grades for the authenticated student.
     */
    @GetMapping("/student/assignments")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<StudentAssignmentSummaryDto>>> getStudentAssignmentAnalytics(Authentication authentication) {
        User user = getUser(authentication.getName());
        StudentAnalyticsResponse studentAnalytics = analyticsService.getStudentAnalytics(user.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Student assignment analytics retrieved successfully", studentAnalytics.getAssignments()));
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }
}
