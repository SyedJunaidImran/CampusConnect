package com.campusconnect.repository;

import com.campusconnect.entity.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Conversation entity database operations.
 */
@Repository
public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    /** Find all conversations for a student, ordered by most recent message */
    List<Conversation> findByStudentIdOrderByLastMessageAtDesc(Long studentId);

    /** Find all conversations for a faculty member, ordered by most recent message */
    List<Conversation> findByFacultyIdOrderByLastMessageAtDesc(Long facultyId);

    /** Find specific conversation for unique student, faculty, and course */
    Optional<Conversation> findByStudentIdAndFacultyIdAndCourseId(Long studentId, Long facultyId, Long courseId);

    /** Check if a conversation already exists for unique student, faculty, and course */
    boolean existsByStudentIdAndFacultyIdAndCourseId(Long studentId, Long facultyId, Long courseId);
}
