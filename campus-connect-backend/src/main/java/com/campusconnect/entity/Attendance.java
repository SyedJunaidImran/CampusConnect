package com.campusconnect.entity;

import com.campusconnect.enums.AttendanceStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Attendance entity — represents attendance of a student in a course on a specific date.
 *
 * RELATIONSHIPS:
 * - Student (Many-to-One): Multiple attendance records belong to a student.
 * - Course (Many-to-One): Multiple attendance records belong to a course.
 *
 * CONSTRAINTS:
 * - Composite unique constraint: (student_id, course_id, attendance_date)
 *   Guarantees at database level that a student cannot have duplicate attendance
 *   for the same course on the same date.
 */
@Entity
@Table(
    name = "attendance",
    uniqueConstraints = {
        @UniqueConstraint(
            name = "uk_student_course_date_attendance",
            columnNames = {"student_id", "course_id", "attendance_date"}
        )
    },
    indexes = {
       @Index(name = "idx_attendance_student_date", columnList = "student_id, attendance_date"),
@Index(name = "idx_attendance_course_date", columnList = "course_id, attendance_date")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private AttendanceStatus status;

    @CreationTimestamp
    @Column(name = "marked_at", updatable = false)
    private LocalDateTime markedAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public Attendance(Student student, Course course, LocalDate attendanceDate, AttendanceStatus status) {
        this.student = student;
        this.course = course;
        this.attendanceDate = attendanceDate;
        this.status = status;
    }
}
