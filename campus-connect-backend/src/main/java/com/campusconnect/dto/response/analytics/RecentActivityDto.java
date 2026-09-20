package com.campusconnect.dto.response.analytics;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RecentActivityDto {
    private String type; // ENROLLMENT, ASSIGNMENT, ANNOUNCEMENT, ATTENDANCE, STUDY_MATERIAL
    private String title;
    private String description;
    private LocalDateTime timestamp;
}
