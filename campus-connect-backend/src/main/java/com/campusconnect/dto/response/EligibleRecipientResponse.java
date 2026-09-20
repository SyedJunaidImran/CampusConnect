package com.campusconnect.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for eligible recipients when starting a conversation.
 * For Students: lists faculty teaching their enrolled courses.
 * For Faculty: lists students enrolled in their assigned courses.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EligibleRecipientResponse {

    private Long id; // Student ID or Faculty ID
    private String name;
    private String identifier; // Roll number or Designation
    private String department;
    private Long courseId;
    private String courseCode;
    private String courseName;
}
