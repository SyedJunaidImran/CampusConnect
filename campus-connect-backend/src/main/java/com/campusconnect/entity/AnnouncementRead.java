package com.campusconnect.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * AnnouncementRead entity — tracks read receipts for announcements per user.
 * Enables unread count badges and "Mark as Read" functionality across dashboards.
 */
@Entity
@Table(name = "announcement_reads", uniqueConstraints = {
        @UniqueConstraint(name = "uk_announcement_user_read", columnNames = {"announcement_id", "user_id"})
}, indexes = {
        @Index(name = "idx_announcement_read_user", columnList = "user_id"),
        @Index(name = "idx_announcement_read_announcement", columnList = "announcement_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementRead {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "announcement_id", nullable = false)
    private Announcement announcement;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @CreationTimestamp
    @Column(name = "read_at", nullable = false, updatable = false)
    private LocalDateTime readAt;

    public AnnouncementRead(Announcement announcement, User user) {
        this.announcement = announcement;
        this.user = user;
        this.readAt = LocalDateTime.now();
    }
}
