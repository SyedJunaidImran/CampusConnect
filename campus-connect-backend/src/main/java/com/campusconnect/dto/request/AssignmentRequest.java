package com.campusconnect.dto.request;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * DTO for creating or updating an Assignment.
 */
@Getter
@Setter
@NoArgsConstructor
public class AssignmentRequest {

    @NotNull(message = "Course ID is required")
    private Long courseId;

    @NotBlank(message = "Assignment title is required")
    @Size(min = 2, max = 200, message = "Title must be between 2 and 200 characters")
    private String title;

    private String description;

    @NotNull(message = "Due date is required")
    private LocalDateTime dueDate;

    @NotNull(message = "Total marks is required")
    @Min(value = 1, message = "Total marks must be at least 1")
    @Max(value = 1000, message = "Total marks must be at most 1000")
    private Integer totalMarks;
}
