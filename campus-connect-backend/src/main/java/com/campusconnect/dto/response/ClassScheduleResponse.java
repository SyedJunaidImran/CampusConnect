package com.campusconnect.dto.response;

import com.campusconnect.enums.DayOfWeek;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Response DTO representing class schedule details.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ClassScheduleResponse {

    private Long id;

    // Course info
    private Long courseId;
    private String courseCode;
    private String courseName;

    // Faculty info
    private Long facultyId;
    private String facultyName;
    private String facultyEmail;

    // Schedule info
    private DayOfWeek dayOfWeek;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime startTime;

    @JsonFormat(pattern = "HH:mm")
    private LocalTime endTime;

    private String room;
    private Integer semester;
    private String department;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
