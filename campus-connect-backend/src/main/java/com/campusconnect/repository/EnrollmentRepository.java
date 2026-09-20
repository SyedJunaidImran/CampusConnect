package com.campusconnect.repository;

import com.campusconnect.entity.Enrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Enrollment entity database operations.
 */
@Repository
public interface EnrollmentRepository extends JpaRepository<Enrollment, Long> {

    /** Find all enrollments for a specific student */
    List<Enrollment> findByStudentId(Long studentId);

    /** Find all enrollments for a specific course */
    List<Enrollment> findByCourseId(Long courseId);

    /** Find enrollment for a specific student in a specific course */
    Optional<Enrollment> findByStudentIdAndCourseId(Long studentId, Long courseId);

    /** Check if a student is already enrolled in a course */
    boolean existsByStudentIdAndCourseId(Long studentId, Long courseId);

    /** Delete enrollment for a student in a course */
    void deleteByStudentIdAndCourseId(Long studentId, Long courseId);

    /** Count how many students are enrolled in a specific course */
    long countByCourseId(Long courseId);

    /** Count how many courses a specific student is enrolled in */
    long countByStudentId(Long studentId);
}
