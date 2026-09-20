package com.campusconnect.controller;

import com.campusconnect.dto.request.ClassScheduleRequest;
import com.campusconnect.dto.response.ApiResponse;
import com.campusconnect.dto.response.ClassScheduleResponse;
import com.campusconnect.enums.DayOfWeek;
import com.campusconnect.service.ClassScheduleService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for Timetable & Class Schedule management.
 *
 * AUTHORIZATION:
 * - ADMIN: Full CRUD on all schedules.
 * - FACULTY: View own assigned schedules, today's schedule, upcoming classes.
 * - STUDENT: View schedules for enrolled courses, today's schedule, upcoming classes.
 */
@RestController
@RequestMapping("/api/schedules")
public class ClassScheduleController {

    private final ClassScheduleService classScheduleService;

    public ClassScheduleController(ClassScheduleService classScheduleService) {
        this.classScheduleService = classScheduleService;
    }

    /**
     * GET /api/schedules
     * Role-aware listing:
     * - ADMIN: returns all schedules (support query filters: day, courseId, facultyId, room, semester, department)
     * - FACULTY: returns teaching schedule
     * - STUDENT: returns timetable for enrolled courses
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<ClassScheduleResponse>>> getSchedules(
            @RequestParam(required = false) DayOfWeek day,
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) Long facultyId,
            @RequestParam(required = false) String room,
            @RequestParam(required = false) Integer semester,
            @RequestParam(required = false) String department,
            Authentication authentication) {

        String email = authentication != null ? authentication.getName() : null;
        boolean isStudent = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_STUDENT"));
        boolean isFaculty = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_FACULTY"));

        List<ClassScheduleResponse> schedules;
        if (isStudent && email != null) {
            schedules = classScheduleService.getStudentSchedules(email);
        } else if (isFaculty && email != null) {
            schedules = classScheduleService.getFacultySchedules(email);
        } else {
            // ADMIN or fallback
            schedules = classScheduleService.getAllSchedules(day, courseId, facultyId, room, semester, department);
        }

        return ResponseEntity.ok(ApiResponse.success("Class schedules retrieved successfully", schedules));
    }

    /**
     * GET /api/schedules/{id}
     * Get single schedule by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ClassScheduleResponse>> getScheduleById(@PathVariable Long id) {
        ClassScheduleResponse schedule = classScheduleService.getScheduleById(id);
        return ResponseEntity.ok(ApiResponse.success("Class schedule retrieved successfully", schedule));
    }

    /**
     * POST /api/schedules
     * Create a new class schedule (Admin only).
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ClassScheduleResponse>> createSchedule(
            @Valid @RequestBody ClassScheduleRequest request) {
        ClassScheduleResponse created = classScheduleService.createSchedule(request);
        return new ResponseEntity<>(
                ApiResponse.success("Class schedule created successfully", created),
                HttpStatus.CREATED
        );
    }

    /**
     * PUT /api/schedules/{id}
     * Update an existing class schedule (Admin only).
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ClassScheduleResponse>> updateSchedule(
            @PathVariable Long id,
            @Valid @RequestBody ClassScheduleRequest request) {
        ClassScheduleResponse updated = classScheduleService.updateSchedule(id, request);
        return ResponseEntity.ok(ApiResponse.success("Class schedule updated successfully", updated));
    }

    /**
     * DELETE /api/schedules/{id}
     * Delete a class schedule (Admin only).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteSchedule(@PathVariable Long id) {
        classScheduleService.deleteSchedule(id);
        return ResponseEntity.ok(ApiResponse.success("Class schedule deleted successfully"));
    }

    /**
     * GET /api/schedules/day/{day}
     * Get all schedules for a specific day.
     */
    @GetMapping("/day/{day}")
    public ResponseEntity<ApiResponse<List<ClassScheduleResponse>>> getSchedulesByDay(
            @PathVariable DayOfWeek day) {
        List<ClassScheduleResponse> schedules = classScheduleService.getSchedulesByDay(day);
        return ResponseEntity.ok(ApiResponse.success("Schedules for " + day + " retrieved successfully", schedules));
    }

    /**
     * GET /api/schedules/course/{courseId}
     * Get all schedules for a specific course.
     */
    @GetMapping("/course/{courseId}")
    public ResponseEntity<ApiResponse<List<ClassScheduleResponse>>> getSchedulesByCourse(
            @PathVariable Long courseId) {
        List<ClassScheduleResponse> schedules = classScheduleService.getSchedulesByCourse(courseId);
        return ResponseEntity.ok(ApiResponse.success("Course schedules retrieved successfully", schedules));
    }

    /**
     * GET /api/schedules/faculty/my
     * Get timetable for logged-in faculty.
     */
    @GetMapping("/faculty/my")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<ApiResponse<List<ClassScheduleResponse>>> getMyFacultySchedules(
            Authentication authentication) {
        List<ClassScheduleResponse> schedules = classScheduleService.getFacultySchedules(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Your teaching schedule retrieved successfully", schedules));
    }

    /**
     * GET /api/schedules/student/my
     * Get timetable for logged-in student (enrolled courses).
     */
    @GetMapping("/student/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<ClassScheduleResponse>>> getMyStudentSchedules(
            Authentication authentication) {
        List<ClassScheduleResponse> schedules = classScheduleService.getStudentSchedules(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Your enrolled timetable retrieved successfully", schedules));
    }

    /**
     * GET /api/schedules/today
     * Get today's classes for the authenticated user.
     */
    @GetMapping("/today")
    public ResponseEntity<ApiResponse<List<ClassScheduleResponse>>> getTodaySchedules(
            Authentication authentication) {
        List<ClassScheduleResponse> schedules = classScheduleService.getTodaySchedules(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Today's classes retrieved successfully", schedules));
    }

    /**
     * GET /api/schedules/upcoming
     * Get today's remaining / upcoming classes for the authenticated user.
     */
    @GetMapping("/upcoming")
    public ResponseEntity<ApiResponse<List<ClassScheduleResponse>>> getUpcomingClasses(
            Authentication authentication) {
        List<ClassScheduleResponse> schedules = classScheduleService.getUpcomingClasses(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Upcoming classes retrieved successfully", schedules));
    }
}
