package com.campusconnect.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Course entity — represents an academic course/subject in the college.
 *
 * RELATIONSHIPS:
 * 1. Course -> Faculty (Many-to-One):
 *    Multiple courses can be taught by one faculty member.
 *    Optional/nullable because an admin may create a course before assigning a professor.
 *
 * 2. Course -> Enrollment (One-to-Many):
 *    A course has many student enrollments.
 *
 * CONSTRAINTS:
 * - course_code is UNIQUE (e.g., "CS101", "IT202") and NOT NULL.
 */
@Entity
@Table(name = "courses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Course {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "course_code", nullable = false, unique = true, length = 20)
    private String courseCode;

    @Column(name = "course_name", nullable = false, length = 100)
    private String courseName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, length = 50)
    private String department;

    @Column(nullable = false)
    private Integer semester;

    @Column(nullable = false)
    private Integer credits;

    /**
     * The faculty member assigned to teach this course.
     * Many courses can be assigned to one faculty member.
     */
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "faculty_id")
    private Faculty faculty;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
