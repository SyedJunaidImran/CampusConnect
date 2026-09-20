package com.campusconnect.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Response DTO for Faculty members.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class FacultyResponse {

    private Long id; // Faculty ID
    private Long userId; // User ID
    private String email;
    private String fullName;
    private String employeeId;
    private String department;
    private String designation;
    private String phone;
    private Long assignedCoursesCount;
}
