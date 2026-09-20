package com.campusconnect.controller;

import com.campusconnect.dto.request.StudentProfileUpdateRequest;
import com.campusconnect.dto.response.ApiResponse;
import com.campusconnect.dto.response.EnrollmentResponse;
import com.campusconnect.dto.response.StudentProfileResponse;
import com.campusconnect.service.EnrollmentService;
import com.campusconnect.service.StudentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * StudentController — REST endpoints for Student profiles, enrollments, and admin student lists.
 */
@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentService studentService;
    private final EnrollmentService enrollmentService;

    public StudentController(StudentService studentService, EnrollmentService enrollmentService) {
        this.studentService = studentService;
        this.enrollmentService = enrollmentService;
    }

    /**
     * GET /api/students/profile
     * Get the logged-in student's profile.
     */
    @GetMapping("/profile")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> getMyProfile(Authentication authentication) {
        StudentProfileResponse profile = studentService.getProfileByEmail(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Student profile retrieved successfully", profile));
    }

    /**
     * PUT /api/students/profile
     * Update the logged-in student's profile (name, phone, semester).
     */
    @PutMapping("/profile")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> updateMyProfile(
            @Valid @RequestBody StudentProfileUpdateRequest request,
            Authentication authentication) {
        StudentProfileResponse updated = studentService.updateProfile(authentication.getName(), request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", updated));
    }

    /**
     * GET /api/students/courses
     * Get courses the logged-in student is currently enrolled in.
     */
    @GetMapping("/courses")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<EnrollmentResponse>>> getMyEnrolledCourses(Authentication authentication) {
        List<EnrollmentResponse> courses = enrollmentService.getStudentEnrolledCourses(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Enrolled courses retrieved successfully", courses));
    }

    /**
     * POST /api/students/enroll/{courseId}
     * Enroll the logged-in student into a course.
     */
    @PostMapping("/enroll/{courseId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<EnrollmentResponse>> enrollInCourse(
            @PathVariable Long courseId,
            Authentication authentication) {
        EnrollmentResponse enrollment = enrollmentService.enrollStudent(authentication.getName(), courseId);
        return new ResponseEntity<>(
                ApiResponse.success("Enrolled in course successfully", enrollment),
                HttpStatus.CREATED
        );
    }

    /**
     * DELETE /api/students/unenroll/{courseId}
     * Drop / unenroll from a course.
     */
    @DeleteMapping("/unenroll/{courseId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<Void>> unenrollFromCourse(
            @PathVariable Long courseId,
            Authentication authentication) {
        enrollmentService.unenrollStudent(authentication.getName(), courseId);
        return ResponseEntity.ok(ApiResponse.success("Unenrolled from course successfully"));
    }

    /**
     * GET /api/students
     * Get all students directory (Admin only).
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<StudentProfileResponse>>> getAllStudents() {
        List<StudentProfileResponse> students = studentService.getAllStudents();
        return ResponseEntity.ok(ApiResponse.success("Students directory retrieved successfully", students));
    }

    /**
     * GET /api/students/{id}
     * Get specific student details by ID (Admin only).
     */
    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<StudentProfileResponse>> getStudentById(@PathVariable Long id) {
        StudentProfileResponse student = studentService.getStudentById(id);
        return ResponseEntity.ok(ApiResponse.success("Student details retrieved successfully", student));
    }
}
