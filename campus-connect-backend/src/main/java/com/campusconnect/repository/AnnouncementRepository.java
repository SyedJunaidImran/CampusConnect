package com.campusconnect.repository;

import com.campusconnect.entity.Announcement;
import com.campusconnect.enums.AnnouncementTarget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

/**
 * Repository for Announcement entity operations.
 */
@Repository
public interface AnnouncementRepository extends JpaRepository<Announcement, Long> {

    List<Announcement> findAllByOrderByCreatedAtDesc();

    List<Announcement> findByCourseIdOrderByCreatedAtDesc(Long courseId);

    List<Announcement> findByAuthorIdOrderByCreatedAtDesc(Long authorId);

    List<Announcement> findByTargetAudienceOrderByCreatedAtDesc(AnnouncementTarget targetAudience);

    /**
     * Query for Student scope:
     * Returns published announcements that are either GLOBAL, targeted to STUDENT,
     * or targeted to COURSE where the student is currently enrolled.
     */
    @Query("SELECT a FROM Announcement a WHERE a.isPublished = true AND " +
           "(a.targetAudience IN ('GLOBAL', 'STUDENT') OR " +
           "(a.targetAudience = 'COURSE' AND a.course.id IN :courseIds)) " +
           "ORDER BY a.createdAt DESC")
    List<Announcement> findForStudentWithCourses(@Param("courseIds") Collection<Long> courseIds);

    /**
     * Query for Student scope when no course enrollments exist.
     */
    @Query("SELECT a FROM Announcement a WHERE a.isPublished = true AND " +
           "a.targetAudience IN ('GLOBAL', 'STUDENT') " +
           "ORDER BY a.createdAt DESC")
    List<Announcement> findForStudentGeneral();

    /**
     * Query for Faculty scope:
     * Returns:
     * 1. All announcements created by this faculty author (even unpublished drafts)
     * 2. Published announcements that are GLOBAL or targeted to FACULTY
     * 3. Published announcements for courses assigned to this faculty
     */
    @Query("SELECT a FROM Announcement a WHERE " +
           "a.author.id = :authorId OR " +
           "(a.isPublished = true AND (a.targetAudience IN ('GLOBAL', 'FACULTY') OR " +
           "(a.targetAudience = 'COURSE' AND a.course.id IN :courseIds))) " +
           "ORDER BY a.createdAt DESC")
    List<Announcement> findForFacultyWithCourses(@Param("authorId") Long authorId,
                                                @Param("courseIds") Collection<Long> courseIds);

    /**
     * Query for Faculty scope when no courses are assigned yet.
     */
    @Query("SELECT a FROM Announcement a WHERE " +
           "a.author.id = :authorId OR " +
           "(a.isPublished = true AND a.targetAudience IN ('GLOBAL', 'FACULTY')) " +
           "ORDER BY a.createdAt DESC")
    List<Announcement> findForFacultyGeneral(@Param("authorId") Long authorId);
}
