package com.campusconnect.dto.request;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO for grading a student's assignment submission.
 */
@Getter
@Setter
@NoArgsConstructor
public class GradeSubmissionRequest {

    @NotNull(message = "Marks are required")
    @Min(value = 0, message = "Marks cannot be negative")
    private Integer marks;

    private String feedback;
}
