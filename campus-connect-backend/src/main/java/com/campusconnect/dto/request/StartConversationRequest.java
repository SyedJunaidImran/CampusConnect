package com.campusconnect.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for initiating a new conversation.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class StartConversationRequest {

    @NotNull(message = "Recipient ID is required")
    private Long recipientId;

    @NotNull(message = "Course ID is required")
    private Long courseId;

    @NotBlank(message = "Initial message content cannot be blank")
    @Size(max = 2000, message = "Message content must not exceed 2000 characters")
    private String message;
}
