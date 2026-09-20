package com.campusconnect.repository;

import com.campusconnect.entity.AssignmentSubmission;
import com.campusconnect.enums.SubmissionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for AssignmentSubmission entity database operations.
 */
@Repository
public interface AssignmentSubmissionRepository extends JpaRepository<AssignmentSubmission, Long> {

    /** Find all submissions for a specific assignment */
    List<AssignmentSubmission> findByAssignmentId(Long assignmentId);

    /** Find all submissions by a specific student */
    List<AssignmentSubmission> findByStudentId(Long studentId);

    /** Find a student's submission for a specific assignment */
    Optional<AssignmentSubmission> findByAssignmentIdAndStudentId(Long assignmentId, Long studentId);

    /** Check if a student already submitted for an assignment */
    boolean existsByAssignmentIdAndStudentId(Long assignmentId, Long studentId);

    /** Count total submissions for an assignment */
    long countByAssignmentId(Long assignmentId);

    /** Count submissions by status for an assignment */
    long countByAssignmentIdAndStatus(Long assignmentId, SubmissionStatus status);

    /** Count pending (non-graded) submissions for a faculty member's assignments */
    long countByAssignmentFacultyIdAndStatus(Long facultyId, SubmissionStatus status);

    /** Count total submissions by status across all assignments */
    long countByStatus(SubmissionStatus status);

    /** Count total submissions for all assignments of a faculty member */
    long countByAssignmentFacultyId(Long facultyId);

    /** Count total submissions for a course */
    long countByAssignmentCourseId(Long courseId);

    /** Count submissions for a course by status */
    long countByAssignmentCourseIdAndStatus(Long courseId, SubmissionStatus status);

    /** Find all submissions for assignments belonging to a course */
    List<AssignmentSubmission> findByAssignmentCourseId(Long courseId);

    /** Count submissions by student and status */
    long countByStudentIdAndStatus(Long studentId, SubmissionStatus status);
}
