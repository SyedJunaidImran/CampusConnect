package com.campusconnect.controller;

import com.campusconnect.dto.request.AnnouncementRequest;
import com.campusconnect.dto.response.ApiResponse;
import com.campusconnect.dto.response.AnnouncementResponse;
import com.campusconnect.enums.AnnouncementTarget;
import com.campusconnect.service.AnnouncementService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST Controller for Announcements and Notification Read Receipts.
 */
@RestController
@RequestMapping("/api/announcements")
public class AnnouncementController {

    private final AnnouncementService announcementService;

    public AnnouncementController(AnnouncementService announcementService) {
        this.announcementService = announcementService;
    }

    /**
     * GET /api/announcements
     * Role-aware listing of accessible announcements with optional filters.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<AnnouncementResponse>>> getAllAnnouncements(
            @RequestParam(required = false) AnnouncementTarget targetAudience,
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) Boolean isPublished,
            @RequestParam(required = false) Boolean unreadOnly,
            Authentication authentication) {

        List<AnnouncementResponse> announcements = announcementService.getAnnouncementsForUser(
                authentication.getName(), targetAudience, courseId, isPublished, unreadOnly);
        return ResponseEntity.ok(ApiResponse.success("Announcements retrieved successfully", announcements));
    }

    /**
     * GET /api/announcements/unread-count
     * Returns unread announcements count for current user badge indicators.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getUnreadCount(Authentication authentication) {
        long unreadCount = announcementService.getUnreadCount(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Unread count retrieved", Map.of("unreadCount", unreadCount)));
    }

    /**
     * GET /api/announcements/{id}
     * Retrieve single announcement details (auto marks as read).
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AnnouncementResponse>> getAnnouncementById(
            @PathVariable Long id, Authentication authentication) {

        AnnouncementResponse response = announcementService.getAnnouncementById(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Announcement details retrieved", response));
    }

    /**
     * POST /api/announcements
     * Create a new announcement (Admin for any audience/course, Faculty for assigned courses).
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    public ResponseEntity<ApiResponse<AnnouncementResponse>> createAnnouncement(
            @Valid @RequestBody AnnouncementRequest request,
            Authentication authentication) {

        AnnouncementResponse response = announcementService.createAnnouncement(authentication.getName(), request);
        return new ResponseEntity<>(ApiResponse.success("Announcement created successfully", response), HttpStatus.CREATED);
    }

    /**
     * PUT /api/announcements/{id}
     * Update an announcement (Admin for any, Faculty for own).
     */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    public ResponseEntity<ApiResponse<AnnouncementResponse>> updateAnnouncement(
            @PathVariable Long id,
            @Valid @RequestBody AnnouncementRequest request,
            Authentication authentication) {

        AnnouncementResponse response = announcementService.updateAnnouncement(authentication.getName(), id, request);
        return ResponseEntity.ok(ApiResponse.success("Announcement updated successfully", response));
    }

    /**
     * DELETE /api/announcements/{id}
     * Delete an announcement.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteAnnouncement(
            @PathVariable Long id,
            Authentication authentication) {

        announcementService.deleteAnnouncement(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Announcement deleted successfully", null));
    }

    /**
     * PATCH /api/announcements/{id}/publish
     * Toggle publication status.
     */
    @PatchMapping("/{id}/publish")
    @PreAuthorize("hasAnyRole('FACULTY', 'ADMIN')")
    public ResponseEntity<ApiResponse<AnnouncementResponse>> togglePublish(
            @PathVariable Long id,
            @RequestParam boolean publish,
            Authentication authentication) {

        AnnouncementResponse response = announcementService.togglePublish(authentication.getName(), id, publish);
        return ResponseEntity.ok(ApiResponse.success("Announcement publication status updated", response));
    }

    /**
     * POST /api/announcements/{id}/read
     * Mark an announcement as read.
     */
    @PostMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(
            @PathVariable Long id,
            Authentication authentication) {

        announcementService.markAsRead(authentication.getName(), id);
        return ResponseEntity.ok(ApiResponse.success("Announcement marked as read", null));
    }

    /**
     * POST /api/announcements/read-all
     * Mark all accessible announcements as read.
     */
    @PostMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead(Authentication authentication) {
        announcementService.markAllAsRead(authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("All announcements marked as read", null));
    }
}
