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
 * Assignment entity — represents an assignment created by faculty for a course.
 *
 * RELATIONSHIPS:
 * - Many-to-One with Course: multiple assignments belong to one course.
 * - Many-to-One with Faculty: multiple assignments created by one faculty.
 *
 * INDEXES:
 * - course_id — frequent lookups by course.
 * - faculty_id — frequent lookups by faculty.
 */
@Entity
@Table(
    name = "assignments",
    indexes = {
        @Index(name = "idx_assignment_course", columnList = "course_id"),
        @Index(name = "idx_assignment_faculty", columnList = "faculty_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "faculty_id", nullable = false)
    private Faculty faculty;

    @Column(name = "due_date", nullable = false)
    private LocalDateTime dueDate;

    @Column(name = "total_marks", nullable = false)
    private Integer totalMarks;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
