package com.campusconnect.dto.response;

import com.campusconnect.enums.Role;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO representing an individual chat message.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {

    private Long id;
    private Long conversationId;

    // Sender details
    private Long senderId;
    private String senderName;
    private Role senderRole;

    private String content;

    @JsonProperty("isRead")
    private boolean isRead;

    private LocalDateTime readAt;
    private LocalDateTime sentAt;
}
