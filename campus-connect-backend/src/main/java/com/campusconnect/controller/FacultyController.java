package com.campusconnect.controller;

import com.campusconnect.dto.response.ApiResponse;
import com.campusconnect.dto.response.FacultyResponse;
import com.campusconnect.service.FacultyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * FacultyController — REST endpoints for Faculty queries.
 */
@RestController
@RequestMapping("/api/faculty")
public class FacultyController {

    private final FacultyService facultyService;

    public FacultyController(FacultyService facultyService) {
        this.facultyService = facultyService;
    }

    /**
     * GET /api/faculty
     * List all faculty members (for Admin course creation dropdown and general college directory).
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<FacultyResponse>>> getAllFaculty() {
        List<FacultyResponse> facultyList = facultyService.getAllFaculty();
        return ResponseEntity.ok(ApiResponse.success("Faculty directory retrieved successfully", facultyList));
    }
}
