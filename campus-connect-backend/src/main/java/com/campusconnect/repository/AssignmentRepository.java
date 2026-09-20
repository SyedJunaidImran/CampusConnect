package com.campusconnect.repository;

import com.campusconnect.entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Assignment entity database operations.
 */
@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {

    /** Find all assignments for a specific course */
    List<Assignment> findByCourseId(Long courseId);

    /** Find all assignments created by a specific faculty member */
    List<Assignment> findByFacultyId(Long facultyId);

    /** Find assignments for multiple courses (student's enrolled courses) */
    List<Assignment> findByCourseIdIn(List<Long> courseIds);

    /** Count assignments by faculty */
    long countByFacultyId(Long facultyId);

    /** Count all assignments for a course */
    long countByCourseId(Long courseId);
}
