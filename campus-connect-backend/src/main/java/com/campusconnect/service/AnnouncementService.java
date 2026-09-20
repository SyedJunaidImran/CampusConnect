package com.campusconnect.service;

import com.campusconnect.dto.request.AnnouncementRequest;
import com.campusconnect.dto.response.AnnouncementResponse;
import com.campusconnect.entity.*;
import com.campusconnect.enums.AnnouncementPriority;
import com.campusconnect.enums.AnnouncementTarget;
import com.campusconnect.enums.Role;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for Announcement business logic, role-scoped queries, and read tracking.
 */
@Service
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final AnnouncementReadRepository announcementReadRepository;
    private final CourseRepository courseRepository;
    private final FacultyRepository facultyRepository;
    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;

    public AnnouncementService(AnnouncementRepository announcementRepository,
                               AnnouncementReadRepository announcementReadRepository,
                               CourseRepository courseRepository,
                               FacultyRepository facultyRepository,
                               StudentRepository studentRepository,
                               EnrollmentRepository enrollmentRepository,
                               UserRepository userRepository) {
        this.announcementRepository = announcementRepository;
        this.announcementReadRepository = announcementReadRepository;
        this.courseRepository = courseRepository;
        this.facultyRepository = facultyRepository;
        this.studentRepository = studentRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
    }

    /**
     * Create an announcement.
     * Admin can create Global, Role-specific, or Course-specific announcements.
     * Faculty can only create Course-specific announcements for courses assigned to them.
     * Students cannot create announcements.
     */
    @Transactional
    public AnnouncementResponse createAnnouncement(String email, AnnouncementRequest request) {
        User user = getUserByEmail(email);

        if (user.getRole() == Role.STUDENT) {
            throw new SecurityException("Students are not authorized to publish announcements");
        }

        Course course = null;
        AnnouncementTarget target = request.getTargetAudience() != null ? request.getTargetAudience() : AnnouncementTarget.GLOBAL;

        if (user.getRole() == Role.FACULTY) {
            if (target != AnnouncementTarget.COURSE) {
                throw new SecurityException("Faculty members can only create course-specific announcements for their assigned courses");
            }
        }

        if (target == AnnouncementTarget.COURSE) {
            if (request.getCourseId() == null) {
                throw new IllegalArgumentException("Course ID is required for course-specific announcements");
            }
            course = courseRepository.findById(request.getCourseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Course", "id", request.getCourseId()));

            if (user.getRole() == Role.FACULTY) {
                Faculty faculty = facultyRepository.findByUserEmail(email)
                        .orElseThrow(() -> new ResourceNotFoundException("Faculty profile not found for: " + email));
                if (course.getFaculty() == null || !course.getFaculty().getId().equals(faculty.getId())) {
                    throw new SecurityException("You can only create announcements for courses assigned to you: " + course.getCourseCode());
                }
            }
        }

        Announcement announcement = new Announcement();
        announcement.setTitle(request.getTitle().trim());
        announcement.setContent(request.getContent().trim());
        announcement.setAuthor(user);
        announcement.setTargetAudience(target);
        announcement.setPriority(request.getPriority() != null ? request.getPriority() : AnnouncementPriority.GENERAL);
        announcement.setCourse(course);

        boolean published = request.getIsPublished() == null || Boolean.TRUE.equals(request.getIsPublished());
        announcement.setPublished(published);
        if (published) {
            announcement.setPublishedAt(LocalDateTime.now());
        }

        Announcement saved = announcementRepository.save(announcement);
        // Mark as read for the author automatically
        markAsReadInternal(user, saved);

        return mapToResponse(saved, true, LocalDateTime.now());
    }

    /**
     * Update an announcement.
     */
    @Transactional
    public AnnouncementResponse updateAnnouncement(String email, Long id, AnnouncementRequest request) {
        User user = getUserByEmail(email);
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement", "id", id));

        if (user.getRole() == Role.STUDENT) {
            throw new SecurityException("Students cannot edit announcements");
        }

        if (user.getRole() == Role.FACULTY) {
            if (!announcement.getAuthor().getId().equals(user.getId())) {
                throw new SecurityException("You can only edit announcements that you created");
            }
        }

        AnnouncementTarget target = request.getTargetAudience() != null ? request.getTargetAudience() : announcement.getTargetAudience();
        if (user.getRole() == Role.FACULTY && target != AnnouncementTarget.COURSE) {
            throw new SecurityException("Faculty can only maintain course-specific announcements");
        }

        Course course = null;
        if (target == AnnouncementTarget.COURSE) {
            Long courseId = request.getCourseId() != null ? request.getCourseId() : (announcement.getCourse() != null ? announcement.getCourse().getId() : null);
            if (courseId == null) {
                throw new IllegalArgumentException("Course ID is required for course-specific announcements");
            }
            course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

            if (user.getRole() == Role.FACULTY) {
                Faculty faculty = facultyRepository.findByUserEmail(email).orElseThrow();
                if (course.getFaculty() == null || !course.getFaculty().getId().equals(faculty.getId())) {
                    throw new SecurityException("You are not assigned to this course: " + course.getCourseCode());
                }
            }
        }

        announcement.setTitle(request.getTitle().trim());
        announcement.setContent(request.getContent().trim());
        announcement.setTargetAudience(target);
        announcement.setPriority(request.getPriority() != null ? request.getPriority() : announcement.getPriority());
        announcement.setCourse(course);

        if (request.getIsPublished() != null) {
            boolean wasPublished = announcement.isPublished();
            announcement.setPublished(request.getIsPublished());
            if (!wasPublished && request.getIsPublished()) {
                announcement.setPublishedAt(LocalDateTime.now());
            }
        }

        Announcement updated = announcementRepository.save(announcement);
        boolean isRead = announcementReadRepository.existsByUserIdAndAnnouncementId(user.getId(), updated.getId());
        return mapToResponse(updated, isRead, isRead ? LocalDateTime.now() : null);
    }

    /**
     * Delete an announcement.
     */
    @Transactional
    public void deleteAnnouncement(String email, Long id) {
        User user = getUserByEmail(email);
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement", "id", id));

        if (user.getRole() == Role.STUDENT) {
            throw new SecurityException("Students cannot delete announcements");
        }

        if (user.getRole() == Role.FACULTY) {
            if (!announcement.getAuthor().getId().equals(user.getId())) {
                throw new SecurityException("You can only delete announcements that you created");
            }
        }

        // Clean up read receipts first
        announcementReadRepository.deleteByAnnouncementId(id);
        announcementRepository.delete(announcement);
    }

    /**
     * Toggle publication status.
     */
    @Transactional
    public AnnouncementResponse togglePublish(String email, Long id, boolean publish) {
        User user = getUserByEmail(email);
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement", "id", id));

        if (user.getRole() == Role.STUDENT) {
            throw new SecurityException("Students cannot change announcement publication status");
        }

        if (user.getRole() == Role.FACULTY && !announcement.getAuthor().getId().equals(user.getId())) {
            throw new SecurityException("You can only change publication status for your own announcements");
        }

        announcement.setPublished(publish);
        if (publish && announcement.getPublishedAt() == null) {
            announcement.setPublishedAt(LocalDateTime.now());
        }

        Announcement saved = announcementRepository.save(announcement);
        boolean isRead = announcementReadRepository.existsByUserIdAndAnnouncementId(user.getId(), saved.getId());
        return mapToResponse(saved, isRead, isRead ? LocalDateTime.now() : null);
    }

    /**
     * Retrieve announcements for the authenticated user, with filters.
     */
    @Transactional(readOnly = true)
    public List<AnnouncementResponse> getAnnouncementsForUser(String email,
                                                              AnnouncementTarget targetFilter,
                                                              Long courseFilter,
                                                              Boolean publishedFilter,
                                                              Boolean unreadOnly) {
        User user = getUserByEmail(email);
        List<Announcement> announcements;

        if (user.getRole() == Role.ADMIN) {
            announcements = announcementRepository.findAllByOrderByCreatedAtDesc();
        } else if (user.getRole() == Role.FACULTY) {
            Faculty faculty = facultyRepository.findByUserEmail(email).orElse(null);
            if (faculty != null) {
                List<Course> assignedCourses = courseRepository.findByFacultyId(faculty.getId());
                Set<Long> courseIds = assignedCourses.stream().map(Course::getId).collect(Collectors.toSet());
                if (courseIds.isEmpty()) {
                    announcements = announcementRepository.findForFacultyGeneral(user.getId());
                } else {
                    announcements = announcementRepository.findForFacultyWithCourses(user.getId(), courseIds);
                }
            } else {
                announcements = announcementRepository.findForFacultyGeneral(user.getId());
            }
        } else {
            // Student
            Student student = studentRepository.findByUserEmail(email).orElse(null);
            if (student != null) {
                List<Enrollment> enrollments = enrollmentRepository.findByStudentId(student.getId());
                Set<Long> enrolledCourseIds = enrollments.stream()
                        .map(e -> e.getCourse().getId())
                        .collect(Collectors.toSet());

                if (enrolledCourseIds.isEmpty()) {
                    announcements = announcementRepository.findForStudentGeneral();
                } else {
                    announcements = announcementRepository.findForStudentWithCourses(enrolledCourseIds);
                }
            } else {
                announcements = announcementRepository.findForStudentGeneral();
            }
        }

        if (announcements.isEmpty()) {
            return Collections.emptyList();
        }

        // Fetch read receipts for this user
        List<Long> announcementIds = announcements.stream().map(Announcement::getId).collect(Collectors.toList());
        List<AnnouncementRead> readList = announcementReadRepository.findByUserIdAndAnnouncementIdIn(user.getId(), announcementIds);
        Map<Long, LocalDateTime> readMap = readList.stream()
                .collect(Collectors.toMap(r -> r.getAnnouncement().getId(), AnnouncementRead::getReadAt));

        // Filter and map
        return announcements.stream()
                .filter(a -> targetFilter == null || a.getTargetAudience() == targetFilter)
                .filter(a -> courseFilter == null || (a.getCourse() != null && a.getCourse().getId().equals(courseFilter)))
                .filter(a -> publishedFilter == null || a.isPublished() == publishedFilter)
                .filter(a -> {
                    if (Boolean.TRUE.equals(unreadOnly)) {
                        return !readMap.containsKey(a.getId());
                    }
                    return true;
                })
                .map(a -> {
                    boolean isRead = readMap.containsKey(a.getId());
                    LocalDateTime readAt = readMap.get(a.getId());
                    return mapToResponse(a, isRead, readAt);
                })
                .collect(Collectors.toList());
    }

    /**
     * Get single announcement by ID and auto-mark as read.
     */
    @Transactional
    public AnnouncementResponse getAnnouncementById(String email, Long id) {
        User user = getUserByEmail(email);
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement", "id", id));

        // Validate visibility for Student/Faculty
        if (user.getRole() == Role.STUDENT) {
            if (!announcement.isPublished()) {
                throw new ResourceNotFoundException("Announcement", "id", id);
            }
            if (announcement.getTargetAudience() == AnnouncementTarget.FACULTY || announcement.getTargetAudience() == AnnouncementTarget.ADMIN) {
                throw new SecurityException("You do not have permission to view this announcement");
            }
            if (announcement.getTargetAudience() == AnnouncementTarget.COURSE) {
                Student student = studentRepository.findByUserEmail(email)
                        .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for: " + email));
                boolean enrolled = enrollmentRepository.existsByStudentIdAndCourseId(student.getId(), announcement.getCourse().getId());
                if (!enrolled) {
                    throw new SecurityException("You are not enrolled in the course associated with this announcement");
                }
            }
        }

        // Auto mark as read
        markAsReadInternal(user, announcement);
        return mapToResponse(announcement, true, LocalDateTime.now());
    }

    /**
     * Mark an announcement as read.
     */
    @Transactional
    public void markAsRead(String email, Long id) {
        User user = getUserByEmail(email);
        Announcement announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Announcement", "id", id));
        markAsReadInternal(user, announcement);
    }

    /**
     * Mark all accessible announcements as read for the user.
     */
    @Transactional
    public void markAllAsRead(String email) {
        List<AnnouncementResponse> announcements = getAnnouncementsForUser(email, null, null, true, true);
        User user = getUserByEmail(email);

        List<AnnouncementRead> newReads = announcements.stream()
                .map(a -> {
                    Announcement ann = announcementRepository.findById(a.getId()).orElse(null);
                    return ann != null ? new AnnouncementRead(ann, user) : null;
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        if (!newReads.isEmpty()) {
            announcementReadRepository.saveAll(newReads);
        }
    }

    /**
     * Get unread count for current user.
     */
    @Transactional(readOnly = true)
    public long getUnreadCount(String email) {
        List<AnnouncementResponse> announcements = getAnnouncementsForUser(email, null, null, true, true);
        return announcements.size();
    }

    private void markAsReadInternal(User user, Announcement announcement) {
        if (!announcementReadRepository.existsByUserIdAndAnnouncementId(user.getId(), announcement.getId())) {
            announcementReadRepository.save(new AnnouncementRead(announcement, user));
        }
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));
    }

    private AnnouncementResponse mapToResponse(Announcement a, boolean isRead, LocalDateTime readAt) {
        return AnnouncementResponse.builder()
                .id(a.getId())
                .title(a.getTitle())
                .content(a.getContent())
                .authorId(a.getAuthor().getId())
                .authorName(a.getAuthor().getFullName())
                .authorRole(a.getAuthor().getRole().name())
                .targetAudience(a.getTargetAudience())
                .priority(a.getPriority())
                .courseId(a.getCourse() != null ? a.getCourse().getId() : null)
                .courseCode(a.getCourse() != null ? a.getCourse().getCourseCode() : null)
                .courseName(a.getCourse() != null ? a.getCourse().getCourseName() : null)
                .isPublished(a.isPublished())
                .publishedAt(a.getPublishedAt())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .isRead(isRead)
                .readAt(readAt)
                .build();
    }
}
