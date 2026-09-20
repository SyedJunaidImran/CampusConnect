package com.campusconnect.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Enrollment entity — represents a student enrolled in a specific course.
 *
 * RELATIONSHIPS:
 * - Many-to-One with Student (a student can enroll in multiple courses)
 * - Many-to-One with Course (a course has multiple enrolled students)
 *
 * CONSTRAINTS:
 * - Composite unique constraint on (student_id, course_id)
 *   Prevents duplicate enrollments at the database level.
 */
@Entity
@Table(
    name = "enrollments",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_student_course_enrollment",
            columnNames = {"student_id", "course_id"}
        )
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Enrollment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @CreationTimestamp
    @Column(name = "enrolled_at", updatable = false)
    private LocalDateTime enrolledAt;

    public Enrollment(Student student, Course course) {
        this.student = student;
        this.course = course;
    }
}
