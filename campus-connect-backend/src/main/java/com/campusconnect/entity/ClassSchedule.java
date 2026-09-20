package com.campusconnect.entity;

import com.campusconnect.enums.DayOfWeek;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * ClassSchedule entity — represents a weekly class schedule slot.
 *
 * RELATIONSHIPS:
 * - Many-to-One with Course: multiple schedules belong to one course.
 * - Many-to-One with Faculty: multiple schedules assigned to one faculty.
 *
 * INDEXES:
 * - course_id — fast filtering by course.
 * - faculty_id — fast timetable lookups for professors.
 * - day_of_week — daily schedule lookups.
 * - room — room utilization and conflict checks.
 */
@Entity
@Table(
    name = "class_schedules",
    indexes = {
        @Index(name = "idx_schedule_course", columnList = "course_id"),
        @Index(name = "idx_schedule_faculty", columnList = "faculty_id"),
        @Index(name = "idx_schedule_day", columnList = "day_of_week"),
        @Index(name = "idx_schedule_room", columnList = "room"),
        @Index(name = "idx_schedule_day_room", columnList = "day_of_week, room")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ClassSchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "faculty_id", nullable = false)
    private Faculty faculty;

    @Enumerated(EnumType.STRING)
    @Column(name = "day_of_week", nullable = false, length = 15)
    private DayOfWeek dayOfWeek;

    @Column(name = "start_time", nullable = false)
    private LocalTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalTime endTime;

    @Column(nullable = false, length = 50)
    private String room;

    @Column(nullable = false)
    private Integer semester;

    @Column(nullable = false, length = 50)
    private String department;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
