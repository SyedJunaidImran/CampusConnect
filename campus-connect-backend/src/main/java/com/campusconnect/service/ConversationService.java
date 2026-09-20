package com.campusconnect.service;

import com.campusconnect.dto.request.SendMessageRequest;
import com.campusconnect.dto.request.StartConversationRequest;
import com.campusconnect.dto.response.ConversationResponse;
import com.campusconnect.dto.response.EligibleRecipientResponse;
import com.campusconnect.dto.response.MessageResponse;
import com.campusconnect.entity.*;
import com.campusconnect.enums.Role;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for secure Student-Faculty course-bound messaging operations.
 */
@Service
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final FacultyRepository facultyRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;

    public ConversationService(ConversationRepository conversationRepository,
                               MessageRepository messageRepository,
                               UserRepository userRepository,
                               StudentRepository studentRepository,
                               FacultyRepository facultyRepository,
                               CourseRepository courseRepository,
                               EnrollmentRepository enrollmentRepository) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.facultyRepository = facultyRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
    }

    /**
     * Retrieve all conversations for the authenticated student or faculty member.
     */
    @Transactional(readOnly = true)
    public List<ConversationResponse> getConversationsForUser(String email) {
        User user = getUserByEmail(email);

        if (user.getRole() == Role.ADMIN) {
            throw new SecurityException("Administrator accounts do not participate in private student-faculty messaging threads");
        }

        List<Conversation> conversations;
        if (user.getRole() == Role.STUDENT) {
            Student student = getStudentByUserId(user.getId());
            conversations = conversationRepository.findByStudentIdOrderByLastMessageAtDesc(student.getId());
        } else {
            Faculty faculty = getFacultyByUserId(user.getId());
            conversations = conversationRepository.findByFacultyIdOrderByLastMessageAtDesc(faculty.getId());
        }

        return conversations.stream()
                .map(c -> mapToConversationResponse(c, user.getId()))
                .collect(Collectors.toList());
    }

    /**
     * Retrieve single conversation overview by ID.
     */
    @Transactional(readOnly = true)
    public ConversationResponse getConversationById(String email, Long conversationId) {
        User user = getUserByEmail(email);
        Conversation conversation = getConversationEntity(conversationId);
        validateParticipant(conversation, user);
        return mapToConversationResponse(conversation, user.getId());
    }

    /**
     * Retrieve eligible recipient list for starting a new conversation.
     * Students see faculty teaching their enrolled courses.
     * Faculty see students enrolled in courses they teach.
     */
    @Transactional(readOnly = true)
    public List<EligibleRecipientResponse> getEligibleRecipients(String email) {
        User user = getUserByEmail(email);

        if (user.getRole() == Role.ADMIN) {
            throw new SecurityException("Administrator accounts do not participate in messaging");
        }

        List<EligibleRecipientResponse> recipients = new ArrayList<>();

        if (user.getRole() == Role.STUDENT) {
            Student student = getStudentByUserId(user.getId());
            List<Enrollment> enrollments = enrollmentRepository.findByStudentId(student.getId());

            for (Enrollment e : enrollments) {
                Course course = e.getCourse();
                if (course.getFaculty() != null) {
                    Faculty faculty = course.getFaculty();
                    recipients.add(EligibleRecipientResponse.builder()
                            .id(faculty.getId())
                            .name(faculty.getUser().getFullName())
                            .identifier(faculty.getDesignation() != null ? faculty.getDesignation() : "Instructor")
                            .department(faculty.getDepartment())
                            .courseId(course.getId())
                            .courseCode(course.getCourseCode())
                            .courseName(course.getCourseName())
                            .build());
                }
            }
        } else if (user.getRole() == Role.FACULTY) {
            Faculty faculty = getFacultyByUserId(user.getId());
            List<Course> assignedCourses = courseRepository.findByFacultyId(faculty.getId());

            for (Course course : assignedCourses) {
                List<Enrollment> enrollments = enrollmentRepository.findByCourseId(course.getId());
                for (Enrollment e : enrollments) {
                    Student student = e.getStudent();
                    recipients.add(EligibleRecipientResponse.builder()
                            .id(student.getId())
                            .name(student.getUser().getFullName())
                            .identifier(student.getRollNumber())
                            .department(student.getDepartment())
                            .courseId(course.getId())
                            .courseCode(course.getCourseCode())
                            .courseName(course.getCourseName())
                            .build());
                }
            }
        }

        return recipients;
    }

    /**
     * Start a new conversation or reuse an existing thread for the same student-faculty-course tuple.
     */
    @Transactional
    public ConversationResponse startConversation(String email, StartConversationRequest request) {
        User user = getUserByEmail(email);

        if (user.getRole() == Role.ADMIN) {
            throw new SecurityException("Administrator accounts cannot start private messaging conversations");
        }

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", request.getCourseId()));

        Student student;
        Faculty faculty;

        if (user.getRole() == Role.STUDENT) {
            student = getStudentByUserId(user.getId());

            // Validate that student is enrolled in this course
            if (!enrollmentRepository.existsByStudentIdAndCourseId(student.getId(), course.getId())) {
                throw new SecurityException("You are not enrolled in course " + course.getCourseCode());
            }

            faculty = facultyRepository.findById(request.getRecipientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty", "id", request.getRecipientId()));

            // Validate that faculty is assigned to this course
            if (course.getFaculty() == null || !course.getFaculty().getId().equals(faculty.getId())) {
                throw new SecurityException("Faculty member does not teach course " + course.getCourseCode());
            }
        } else {
            faculty = getFacultyByUserId(user.getId());

            // Validate that faculty teaches this course
            if (course.getFaculty() == null || !course.getFaculty().getId().equals(faculty.getId())) {
                throw new SecurityException("You are not assigned to teach course " + course.getCourseCode());
            }

            student = studentRepository.findById(request.getRecipientId())
                    .orElseThrow(() -> new ResourceNotFoundException("Student", "id", request.getRecipientId()));

            // Validate that student is enrolled in this course
            if (!enrollmentRepository.existsByStudentIdAndCourseId(student.getId(), course.getId())) {
                throw new SecurityException("Student is not enrolled in course " + course.getCourseCode());
            }
        }

        // Check if conversation already exists or create new
        Student finalStudent = student;
        Faculty finalFaculty = faculty;
        Conversation conversation = conversationRepository
                .findByStudentIdAndFacultyIdAndCourseId(student.getId(), faculty.getId(), course.getId())
                .orElseGet(() -> {
                    Conversation newConv = Conversation.builder()
                            .student(finalStudent)
                            .faculty(finalFaculty)
                            .course(course)
                            .build();
                    return conversationRepository.save(newConv);
                });

        // Add initial message
        String trimmedContent = request.getMessage().trim();
        Message message = Message.builder()
                .conversation(conversation)
                .sender(user)
                .content(trimmedContent)
                .isRead(false)
                .build();
        message = messageRepository.save(message);

        // Update conversation summary
        String snippet = trimmedContent.length() > 60 ? trimmedContent.substring(0, 57) + "..." : trimmedContent;
        conversation.setLastMessageSnippet(snippet);
        conversation.setLastMessageAt(message.getSentAt() != null ? message.getSentAt() : LocalDateTime.now());
        conversation = conversationRepository.save(conversation);

        return mapToConversationResponse(conversation, user.getId());
    }

    /**
     * Retrieve message history for a conversation and auto-mark other party's unread messages as read.
     */
    @Transactional
    public List<MessageResponse> getConversationMessages(String email, Long conversationId) {
        User user = getUserByEmail(email);
        Conversation conversation = getConversationEntity(conversationId);
        validateParticipant(conversation, user);

        // Auto mark incoming unread messages as read
        List<Message> unread = messageRepository.findByConversationIdAndSenderIdNotAndIsReadFalse(conversationId, user.getId());
        if (!unread.isEmpty()) {
            LocalDateTime now = LocalDateTime.now();
            unread.forEach(m -> {
                m.setRead(true);
                m.setReadAt(now);
            });
            messageRepository.saveAll(unread);
        }

        List<Message> messages = messageRepository.findByConversationIdOrderBySentAtAsc(conversationId);
        return messages.stream().map(this::mapToMessageResponse).collect(Collectors.toList());
    }

    /**
     * Send a new message in an existing conversation.
     */
    @Transactional
    public MessageResponse sendMessage(String email, Long conversationId, SendMessageRequest request) {
        User user = getUserByEmail(email);
        Conversation conversation = getConversationEntity(conversationId);
        validateParticipant(conversation, user);

        String trimmed = request.getContent().trim();
        if (trimmed.isEmpty()) {
            throw new IllegalArgumentException("Message content cannot be blank");
        }

        Message message = Message.builder()
                .conversation(conversation)
                .sender(user)
                .content(trimmed)
                .isRead(false)
                .build();
        message = messageRepository.save(message);

        String snippet = trimmed.length() > 60 ? trimmed.substring(0, 57) + "..." : trimmed;
        conversation.setLastMessageSnippet(snippet);
        conversation.setLastMessageAt(message.getSentAt() != null ? message.getSentAt() : LocalDateTime.now());
        conversationRepository.save(conversation);

        return mapToMessageResponse(message);
    }

    /**
     * Explicitly mark messages in a conversation as read.
     */
    @Transactional
    public void markMessagesAsRead(String email, Long conversationId) {
        User user = getUserByEmail(email);
        Conversation conversation = getConversationEntity(conversationId);
        validateParticipant(conversation, user);

        List<Message> unread = messageRepository.findByConversationIdAndSenderIdNotAndIsReadFalse(conversationId, user.getId());
        if (!unread.isEmpty()) {
            LocalDateTime now = LocalDateTime.now();
            unread.forEach(m -> {
                m.setRead(true);
                m.setReadAt(now);
            });
            messageRepository.saveAll(unread);
        }
    }

    /**
     * Get total unread incoming messages count for current user badge indicators.
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(String email) {
        User user = getUserByEmail(email);

        if (user.getRole() == Role.STUDENT) {
            Student student = getStudentByUserId(user.getId());
            return messageRepository.countUnreadForStudent(student.getId(), user.getId());
        } else if (user.getRole() == Role.FACULTY) {
            Faculty faculty = getFacultyByUserId(user.getId());
            return messageRepository.countUnreadForFaculty(faculty.getId(), user.getId());
        }

        return 0L;
    }

    // ==========================================
    // HELPER & MAPPING METHODS
    // ==========================================

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    private Student getStudentByUserId(Long userId) {
        return studentRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile", "userId", userId));
    }

    private Faculty getFacultyByUserId(Long userId) {
        return facultyRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty profile", "userId", userId));
    }

    private Conversation getConversationEntity(Long id) {
        return conversationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Conversation", "id", id));
    }

    private void validateParticipant(Conversation conversation, User user) {
        boolean isStudent = conversation.getStudent().getUser().getId().equals(user.getId());
        boolean isFaculty = conversation.getFaculty().getUser().getId().equals(user.getId());

        if (!isStudent && !isFaculty) {
            throw new SecurityException("You are not authorized to access this conversation");
        }
    }

    private ConversationResponse mapToConversationResponse(Conversation c, Long currentUserId) {
        long unread = messageRepository.countByConversationIdAndSenderIdNotAndIsReadFalse(c.getId(), currentUserId);

        return ConversationResponse.builder()
                .id(c.getId())
                .studentId(c.getStudent().getId())
                .studentName(c.getStudent().getUser().getFullName())
                .studentRollNumber(c.getStudent().getRollNumber())
                .facultyId(c.getFaculty().getId())
                .facultyName(c.getFaculty().getUser().getFullName())
                .facultyDepartment(c.getFaculty().getDepartment())
                .facultyDesignation(c.getFaculty().getDesignation())
                .courseId(c.getCourse().getId())
                .courseCode(c.getCourse().getCourseCode())
                .courseName(c.getCourse().getCourseName())
                .lastMessageSnippet(c.getLastMessageSnippet())
                .lastMessageAt(c.getLastMessageAt() != null ? c.getLastMessageAt() : c.getCreatedAt())
                .unreadCount(unread)
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .build();
    }

    private MessageResponse mapToMessageResponse(Message m) {
        return MessageResponse.builder()
                .id(m.getId())
                .conversationId(m.getConversation().getId())
                .senderId(m.getSender().getId())
                .senderName(m.getSender().getFullName())
                .senderRole(m.getSender().getRole())
                .content(m.getContent())
                .isRead(m.isRead())
                .readAt(m.getReadAt())
                .sentAt(m.getSentAt())
                .build();
    }
}
