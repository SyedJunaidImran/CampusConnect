package com.campusconnect.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Response DTO for exposing study material details to API consumers.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StudyMaterialResponse {

    private Long id;
    private String title;
    private String description;
    private Long courseId;
    private String courseCode;
    private String courseName;
    private Long facultyId;
    private String facultyName;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private String fileDownloadUri;
    private String fileViewUri;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
