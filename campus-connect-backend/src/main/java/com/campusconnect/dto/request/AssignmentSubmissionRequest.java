package com.campusconnect.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO for submitting or updating an assignment submission.
 */
@Getter
@Setter
@NoArgsConstructor
public class AssignmentSubmissionRequest {

    @NotBlank(message = "Submission text is required")
    @Size(max = 10000, message = "Submission text must not exceed 10000 characters")
    private String submissionText;
}
