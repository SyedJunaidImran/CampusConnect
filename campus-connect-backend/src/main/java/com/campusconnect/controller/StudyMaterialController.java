package com.campusconnect.controller;

import com.campusconnect.dto.request.StudyMaterialRequest;
import com.campusconnect.dto.response.ApiResponse;
import com.campusconnect.dto.response.StudyMaterialResponse;
import com.campusconnect.entity.StudyMaterial;
import com.campusconnect.service.StudyMaterialService;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * StudyMaterialController — REST endpoints for study materials management, file upload, and download.
 *
 * AUTHORIZATION:
 * - STUDENT: Read & download study materials for enrolled courses only.
 * - FACULTY: Upload, edit, delete materials for assigned courses; view assigned course materials.
 * - ADMIN: Full CRUD across all materials.
 */
@RestController
@RequestMapping("/api/study-materials")
public class StudyMaterialController {

    private final StudyMaterialService studyMaterialService;

    public StudyMaterialController(StudyMaterialService studyMaterialService) {
        this.studyMaterialService = studyMaterialService;
    }

    /**
     * GET /api/study-materials
     * Role-aware listing of all accessible study materials.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<StudyMaterialResponse>>> getAllMaterials(Authentication authentication) {
        List<StudyMaterialResponse> materials = studyMaterialService.getAllStudyMaterials(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Study materials retrieved successfully", materials));
    }

    /**
     * GET /api/study-materials/{id}
     * Get single study material details.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StudyMaterialResponse>> getMaterialById(
            @PathVariable Long id, Authentication authentication) {
        StudyMaterialResponse material = studyMaterialService.getStudyMaterialById(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Study material retrieved successfully", material));
    }

    /**
     * GET /api/study-materials/course/{courseId}
     * Get all study materials for a specific course.
     */
    @GetMapping("/course/{courseId}")
    public ResponseEntity<ApiResponse<List<StudyMaterialResponse>>> getMaterialsByCourse(
            @PathVariable Long courseId, Authentication authentication) {
        List<StudyMaterialResponse> materials = studyMaterialService.getStudyMaterialsByCourse(courseId, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Course study materials retrieved successfully", materials));
    }

    /**
     * POST /api/study-materials
     * Upload a new study material (Faculty for assigned course, Admin for any).
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    public ResponseEntity<ApiResponse<StudyMaterialResponse>> createMaterial(
            @RequestParam("courseId") Long courseId,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam("file") MultipartFile file,
            Authentication authentication) {

        StudyMaterialRequest request = new StudyMaterialRequest(courseId, title, description);
        StudyMaterialResponse created = studyMaterialService.createStudyMaterial(authentication.getName(), request, file);

        return new ResponseEntity<>(
                ApiResponse.success("Study material uploaded successfully", created),
                HttpStatus.CREATED
        );
    }

    /**
     * PUT /api/study-materials/{id}
     * Update an existing study material (Faculty for assigned course, Admin for any).
     */
    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    public ResponseEntity<ApiResponse<StudyMaterialResponse>> updateMaterial(
            @PathVariable Long id,
            @RequestParam("title") String title,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "courseId", required = false) Long courseId,
            @RequestParam(value = "file", required = false) MultipartFile file,
            Authentication authentication) {

        StudyMaterialRequest request = new StudyMaterialRequest(courseId, title, description);
        StudyMaterialResponse updated = studyMaterialService.updateStudyMaterial(authentication.getName(), id, request, file);

        return ResponseEntity.ok(ApiResponse.success("Study material updated successfully", updated));
    }

    /**
     * DELETE /api/study-materials/{id}
     * Delete study material and physical file (Faculty for assigned course, Admin for any).
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteMaterial(
            @PathVariable Long id, Authentication authentication) {
        studyMaterialService.deleteStudyMaterial(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Study material deleted successfully"));
    }

    /**
     * GET /api/study-materials/{id}/download
     * Download the study material file as an attachment.
     */
    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable Long id, Authentication authentication) {
        Resource resource = studyMaterialService.loadFileAsResource(id, authentication.getName());
        StudyMaterial entity = studyMaterialService.getStudyMaterialEntity(id);

        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(entity.getFileType() != null ? entity.getFileType() : "application/octet-stream");
        } catch (Exception e) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + entity.getFileName() + "\"")
                .body(resource);
    }

    /**
     * GET /api/study-materials/{id}/view
     * Preview/view the study material file inline in browser (for PDFs, images, text).
     */
    @GetMapping("/{id}/view")
    public ResponseEntity<Resource> viewFile(
            @PathVariable Long id, Authentication authentication) {
        Resource resource = studyMaterialService.loadFileAsResource(id, authentication.getName());
        StudyMaterial entity = studyMaterialService.getStudyMaterialEntity(id);

        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(entity.getFileType() != null ? entity.getFileType() : "application/octet-stream");
        } catch (Exception e) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + entity.getFileName() + "\"")
                .body(resource);
    }
}
