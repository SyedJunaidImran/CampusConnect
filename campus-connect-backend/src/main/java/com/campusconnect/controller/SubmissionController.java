package com.campusconnect.controller;

import com.campusconnect.dto.request.AssignmentSubmissionRequest;
import com.campusconnect.dto.request.GradeSubmissionRequest;
import com.campusconnect.dto.response.ApiResponse;
import com.campusconnect.dto.response.AssignmentSubmissionResponse;
import com.campusconnect.service.SubmissionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * SubmissionController — REST endpoints for assignment submissions and grading.
 *
 * AUTHORIZATION:
 * - STUDENT: Submit, update own submission, view own submissions.
 * - FACULTY: View submissions for own assignments, grade.
 * - ADMIN: View/grade all submissions.
 */
@RestController
@RequestMapping("/api/submissions")
public class SubmissionController {

    private final SubmissionService submissionService;

    public SubmissionController(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    /**
     * POST /api/submissions/assignment/{assignmentId}
     * Submit an assignment (Student only).
     */
    @PostMapping("/assignment/{assignmentId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<AssignmentSubmissionResponse>> submitAssignment(
            @PathVariable Long assignmentId,
            @Valid @RequestBody AssignmentSubmissionRequest request,
            Authentication authentication) {
        AssignmentSubmissionResponse response =
                submissionService.submitAssignment(authentication.getName(), assignmentId, request);
        return new ResponseEntity<>(
                ApiResponse.success("Assignment submitted successfully", response),
                HttpStatus.CREATED
        );
    }

    /**
     * PUT /api/submissions/{id}
     * Update a submission (Student only, before grading).
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<AssignmentSubmissionResponse>> updateSubmission(
            @PathVariable Long id,
            @Valid @RequestBody AssignmentSubmissionRequest request,
            Authentication authentication) {
        AssignmentSubmissionResponse response =
                submissionService.updateSubmission(authentication.getName(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Submission updated successfully", response));
    }

    /**
     * GET /api/submissions/my
     * Get all submissions for the logged-in student.
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<List<AssignmentSubmissionResponse>>> getMySubmissions(
            Authentication authentication) {
        List<AssignmentSubmissionResponse> submissions =
                submissionService.getMySubmissions(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Your submissions retrieved successfully", submissions));
    }

    /**
     * GET /api/submissions/my/assignment/{assignmentId}
     * Get the logged-in student's submission for a specific assignment.
     */
    @GetMapping("/my/assignment/{assignmentId}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApiResponse<AssignmentSubmissionResponse>> getMySubmissionForAssignment(
            @PathVariable Long assignmentId, Authentication authentication) {
        AssignmentSubmissionResponse response =
                submissionService.getMySubmissionForAssignment(authentication.getName(), assignmentId);
        return ResponseEntity.ok(ApiResponse.success("Submission retrieved successfully", response));
    }

    /**
     * GET /api/submissions/{id}
     * Get a specific submission by ID (authorized).
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AssignmentSubmissionResponse>> getSubmissionById(
            @PathVariable Long id, Authentication authentication) {
        AssignmentSubmissionResponse response =
                submissionService.getSubmissionById(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Submission retrieved successfully", response));
    }

    /**
     * PUT /api/submissions/{id}/grade
     * Grade a submission (Faculty/Admin).
     */
    @PutMapping("/{id}/grade")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    public ResponseEntity<ApiResponse<AssignmentSubmissionResponse>> gradeSubmission(
            @PathVariable Long id,
            @Valid @RequestBody GradeSubmissionRequest request,
            Authentication authentication) {
        AssignmentSubmissionResponse response =
                submissionService.gradeSubmission(authentication.getName(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Submission graded successfully", response));
    }
}
