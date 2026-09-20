package com.campusconnect.dto.request;

import com.campusconnect.enums.AnnouncementPriority;
import com.campusconnect.enums.AnnouncementTarget;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating or updating an announcement.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title cannot exceed 200 characters")
    private String title;

    @NotBlank(message = "Content is required")
    private String content;

    @NotNull(message = "Target audience is required")
    private AnnouncementTarget targetAudience = AnnouncementTarget.GLOBAL;

    private AnnouncementPriority priority = AnnouncementPriority.GENERAL;

    private Long courseId;

    private Boolean isPublished = true;
}
