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
 * StudyMaterial entity — represents a course resource, lecture notes, slides,
 * or reference document uploaded for a course.
 *
 * RELATIONSHIPS:
 * - Many-to-One with Course: multiple materials belong to one course.
 * - Many-to-One with Faculty: material uploaded by/assigned to a faculty member (or admin).
 *
 * INDEXES:
 * - course_id — fast retrieval of materials by course.
 * - faculty_id — fast retrieval of materials uploaded by faculty.
 */
@Entity
@Table(
    name = "study_materials",
    indexes = {
        @Index(name = "idx_study_material_course", columnList = "course_id"),
        @Index(name = "idx_study_material_faculty", columnList = "faculty_id")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class StudyMaterial {

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

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "faculty_id")
    private Faculty faculty;

    @Column(name = "file_name", nullable = false, length = 255)
    private String fileName;

    @Column(name = "stored_file_name", nullable = false, unique = true, length = 255)
    private String storedFileName;

    @Column(name = "file_type", length = 100)
    private String fileType;

    @Column(name = "file_size")
    private Long fileSize;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
