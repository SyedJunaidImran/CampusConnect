package com.campusconnect.repository;

import com.campusconnect.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for Message entity database operations.
 */
@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {

    /** Retrieve all messages in a conversation in chronological order */
    List<Message> findByConversationIdOrderBySentAtAsc(Long conversationId);

    /** Find all unread messages in a conversation where the sender is NOT the current user */
    List<Message> findByConversationIdAndSenderIdNotAndIsReadFalse(Long conversationId, Long senderId);

    /** Count unread messages in a specific conversation where the sender is NOT the current user */
    long countByConversationIdAndSenderIdNotAndIsReadFalse(Long conversationId, Long senderId);

    /** Count all unread incoming messages for a student across all conversations */
    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversation.student.id = :studentId AND m.sender.id != :userId AND m.isRead = false")
    long countUnreadForStudent(@Param("studentId") Long studentId, @Param("userId") Long userId);

    /** Count all unread incoming messages for a faculty member across all conversations */
    @Query("SELECT COUNT(m) FROM Message m WHERE m.conversation.faculty.id = :facultyId AND m.sender.id != :userId AND m.isRead = false")
    long countUnreadForFaculty(@Param("facultyId") Long facultyId, @Param("userId") Long userId);
}
