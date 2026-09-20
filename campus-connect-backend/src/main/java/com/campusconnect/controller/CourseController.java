package com.campusconnect.controller;

import com.campusconnect.dto.request.CourseRequest;
import com.campusconnect.dto.response.ApiResponse;
import com.campusconnect.dto.response.CourseResponse;
import com.campusconnect.dto.response.EnrollmentResponse;
import com.campusconnect.service.CourseService;
import com.campusconnect.service.EnrollmentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * CourseController — REST endpoints for Course operations.
 *
 * AUTHORIZATION:
 * - ADMIN: Full CRUD on courses.
 * - FACULTY: View all courses, view assigned courses, view enrolled students.
 * - STUDENT: View all courses, view course details. (Cannot create/update/delete).
 */
@RestController
@RequestMapping("/api/courses")
public class CourseController {

    private final CourseService courseService;
    private final EnrollmentService enrollmentService;

    public CourseController(CourseService courseService, EnrollmentService enrollmentService) {
        this.courseService = courseService;
        this.enrollmentService = enrollmentService;
    }

    /**
     * GET /api/courses
     * List all courses. Includes isEnrolled flag if accessed by a student.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CourseResponse>>> getAllCourses(Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        List<CourseResponse> courses = courseService.getAllCourses(email);
        return ResponseEntity.ok(ApiResponse.success("Courses retrieved successfully", courses));
    }

    /**
     * GET /api/courses/{id}
     * Get single course by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CourseResponse>> getCourseById(
            @PathVariable Long id,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        CourseResponse course = courseService.getCourseById(id, email);
        return ResponseEntity.ok(ApiResponse.success("Course details retrieved successfully", course));
    }

    /**
     * POST /api/courses
     * Create a new course (Admin only).
     */
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CourseResponse>> createCourse(
            @Valid @RequestBody CourseRequest request) {
        CourseResponse created = courseService.createCourse(request);
        return new ResponseEntity<>(
                ApiResponse.success("Course created successfully", created),
                HttpStatus.CREATED
        );
    }

    /**
     * PUT /api/courses/{id}
     * Update an existing course (Admin only).
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<CourseResponse>> updateCourse(
            @PathVariable Long id,
            @Valid @RequestBody CourseRequest request) {
        CourseResponse updated = courseService.updateCourse(id, request);
        return ResponseEntity.ok(ApiResponse.success("Course updated successfully", updated));
    }

    /**
     * DELETE /api/courses/{id}
     * Delete a course (Admin only).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteCourse(@PathVariable Long id) {
        courseService.deleteCourse(id);
        return ResponseEntity.ok(ApiResponse.success("Course deleted successfully"));
    }

    /**
     * GET /api/courses/faculty/my-courses
     * Get courses assigned to the authenticated faculty member.
     */
    @GetMapping("/faculty/my-courses")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<ApiResponse<List<CourseResponse>>> getMyFacultyCourses(Authentication authentication) {
        List<CourseResponse> courses = courseService.getCoursesByFacultyEmail(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Assigned courses retrieved successfully", courses));
    }

    /**
     * GET /api/courses/{id}/students
     * Get list of enrolled students for a course (Faculty assigned to course, or Admin).
     */
    @GetMapping("/{id}/students")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<EnrollmentResponse>>> getEnrolledStudents(
            @PathVariable Long id,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        List<EnrollmentResponse> students = enrollmentService.getEnrolledStudentsForCourse(id, email);
        return ResponseEntity.ok(ApiResponse.success("Enrolled students retrieved successfully", students));
    }
}
