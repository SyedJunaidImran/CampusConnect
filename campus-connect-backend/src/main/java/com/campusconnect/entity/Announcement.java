package com.campusconnect.entity;

import com.campusconnect.enums.AnnouncementPriority;
import com.campusconnect.enums.AnnouncementTarget;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Announcement entity — represents college-wide, role-specific, or course-specific notices.
 *
 * RELATIONSHIPS:
 * 1. Announcement -> User (author): The administrator or faculty member who created the announcement.
 * 2. Announcement -> Course: Nullable reference for course-specific notices.
 */
@Entity
@Table(name = "announcements", indexes = {
        @Index(name = "idx_announcement_target_published", columnList = "target_audience, is_published"),
        @Index(name = "idx_announcement_course", columnList = "course_id"),
        @Index(name = "idx_announcement_author", columnList = "author_id"),
        @Index(name = "idx_announcement_created_at", columnList = "created_at")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Announcement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_audience", nullable = false, length = 20)
    private AnnouncementTarget targetAudience = AnnouncementTarget.GLOBAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AnnouncementPriority priority = AnnouncementPriority.GENERAL;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "course_id")
    private Course course;

    @Column(name = "is_published", nullable = false)
    private boolean isPublished = true;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void onPrePersist() {
        if (isPublished && publishedAt == null) {
            publishedAt = LocalDateTime.now();
        }
    }
}
