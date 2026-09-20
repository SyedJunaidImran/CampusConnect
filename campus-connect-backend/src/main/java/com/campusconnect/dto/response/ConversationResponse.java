package com.campusconnect.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO representing a conversation overview.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationResponse {

    private Long id;

    // Student details
    private Long studentId;
    private String studentName;
    private String studentRollNumber;

    // Faculty details
    private Long facultyId;
    private String facultyName;
    private String facultyDepartment;
    private String facultyDesignation;

    // Associated course details
    private Long courseId;
    private String courseCode;
    private String courseName;

    // Message status summary
    private String lastMessageSnippet;
    private LocalDateTime lastMessageAt;
    private long unreadCount;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
