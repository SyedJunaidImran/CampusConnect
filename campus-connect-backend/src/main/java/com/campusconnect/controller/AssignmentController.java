package com.campusconnect.controller;

import com.campusconnect.dto.request.AssignmentRequest;
import com.campusconnect.dto.response.ApiResponse;
import com.campusconnect.dto.response.AssignmentResponse;
import com.campusconnect.dto.response.AssignmentStatisticsResponse;
import com.campusconnect.dto.response.AssignmentSubmissionResponse;
import com.campusconnect.service.AssignmentService;
import com.campusconnect.service.SubmissionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * AssignmentController — REST endpoints for Assignment CRUD operations.
 *
 * AUTHORIZATION:
 * - FACULTY: Create/update/delete own assignments. View submissions for own assignments.
 * - ADMIN: Full CRUD on all assignments. View all submissions.
 * - STUDENT: View assignments for enrolled courses only.
 */
@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {

    private final AssignmentService assignmentService;
    private final SubmissionService submissionService;

    public AssignmentController(AssignmentService assignmentService,
                                SubmissionService submissionService) {
        this.assignmentService = assignmentService;
        this.submissionService = submissionService;
    }

    /**
     * GET /api/assignments
     * Role-aware listing:
     * - STUDENT: assignments for enrolled courses
     * - FACULTY: own assignments
     * - ADMIN: all assignments
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<AssignmentResponse>>> getAssignments(Authentication authentication) {
        String email = authentication.getName();
        String role = authentication.getAuthorities().iterator().next().getAuthority();

        List<AssignmentResponse> assignments;
        if (role.equals("ROLE_STUDENT")) {
            assignments = assignmentService.getAssignmentsForStudent(email);
        } else if (role.equals("ROLE_FACULTY")) {
            assignments = assignmentService.getAssignmentsForFaculty(email);
        } else {
            assignments = assignmentService.getAllAssignments();
        }

        return ResponseEntity.ok(ApiResponse.success("Assignments retrieved successfully", assignments));
    }

    /**
     * GET /api/assignments/{id}
     * Get single assignment by ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AssignmentResponse>> getAssignmentById(
            @PathVariable Long id, Authentication authentication) {
        AssignmentResponse assignment = assignmentService.getAssignmentById(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Assignment details retrieved successfully", assignment));
    }

    /**
     * GET /api/assignments/course/{courseId}
     * Get all assignments for a specific course.
     */
    @GetMapping("/course/{courseId}")
    public ResponseEntity<ApiResponse<List<AssignmentResponse>>> getAssignmentsByCourse(
            @PathVariable Long courseId, Authentication authentication) {
        List<AssignmentResponse> assignments = assignmentService.getAssignmentsByCourse(courseId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Course assignments retrieved successfully", assignments));
    }

    /**
     * GET /api/assignments/my
     * Get assignments created by the logged-in faculty.
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('FACULTY')")
    public ResponseEntity<ApiResponse<List<AssignmentResponse>>> getMyAssignments(Authentication authentication) {
        List<AssignmentResponse> assignments = assignmentService.getAssignmentsForFaculty(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Your assignments retrieved successfully", assignments));
    }

    /**
     * POST /api/assignments
     * Create a new assignment (Faculty or Admin only).
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    public ResponseEntity<ApiResponse<AssignmentResponse>> createAssignment(
            @Valid @RequestBody AssignmentRequest request,
            Authentication authentication) {
        AssignmentResponse created = assignmentService.createAssignment(authentication.getName(), request);
        return new ResponseEntity<>(
                ApiResponse.success("Assignment created successfully", created),
                HttpStatus.CREATED
        );
    }

    /**
     * PUT /api/assignments/{id}
     * Update an assignment (Faculty for own, Admin for any).
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    public ResponseEntity<ApiResponse<AssignmentResponse>> updateAssignment(
            @PathVariable Long id,
            @Valid @RequestBody AssignmentRequest request,
            Authentication authentication) {
        AssignmentResponse updated = assignmentService.updateAssignment(authentication.getName(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Assignment updated successfully", updated));
    }

    /**
     * DELETE /api/assignments/{id}
     * Delete an assignment (Faculty for own, Admin for any).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteAssignment(
            @PathVariable Long id, Authentication authentication) {
        assignmentService.deleteAssignment(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Assignment deleted successfully"));
    }

    /**
     * GET /api/assignments/{assignmentId}/submissions
     * Get all submissions for an assignment (Faculty/Admin).
     */
    @GetMapping("/{assignmentId}/submissions")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<AssignmentSubmissionResponse>>> getAssignmentSubmissions(
            @PathVariable Long assignmentId, Authentication authentication) {
        List<AssignmentSubmissionResponse> submissions =
                submissionService.getSubmissionsForAssignment(authentication.getName(), assignmentId);
        return ResponseEntity.ok(ApiResponse.success("Submissions retrieved successfully", submissions));
    }

    /**
     * GET /api/assignments/{assignmentId}/statistics
     * Get submission statistics for an assignment (Faculty/Admin).
     */
    @GetMapping("/{assignmentId}/statistics")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    public ResponseEntity<ApiResponse<AssignmentStatisticsResponse>> getAssignmentStatistics(
            @PathVariable Long assignmentId,
            Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        AssignmentStatisticsResponse stats = assignmentService.getAssignmentStatistics(assignmentId, email);
        return ResponseEntity.ok(ApiResponse.success("Assignment statistics retrieved successfully", stats));
    }
}
