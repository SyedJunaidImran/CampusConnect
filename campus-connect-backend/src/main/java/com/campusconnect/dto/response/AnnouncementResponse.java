package com.campusconnect.dto.response;

import com.campusconnect.enums.AnnouncementPriority;
import com.campusconnect.enums.AnnouncementTarget;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO returned for announcement queries.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementResponse {

    private Long id;
    private String title;
    private String content;

    // Author Details
    private Long authorId;
    private String authorName;
    private String authorRole;

    // Target Audience & Priority
    private AnnouncementTarget targetAudience;
    private AnnouncementPriority priority;

    // Optional Associated Course Details
    private Long courseId;
    private String courseCode;
    private String courseName;

    // Publication Status & Timestamps
    @JsonProperty("isPublished")
    private boolean isPublished;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // Personalized Read Receipt for Requesting User
    @JsonProperty("isRead")
    private boolean isRead;
    private LocalDateTime readAt;
}

