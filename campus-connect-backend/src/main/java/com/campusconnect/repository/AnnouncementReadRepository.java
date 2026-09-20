package com.campusconnect.repository;

import com.campusconnect.entity.AnnouncementRead;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Repository for AnnouncementRead tracking entity.
 */
@Repository
public interface AnnouncementReadRepository extends JpaRepository<AnnouncementRead, Long> {

    Optional<AnnouncementRead> findByUserIdAndAnnouncementId(Long userId, Long announcementId);

    boolean existsByUserIdAndAnnouncementId(Long userId, Long announcementId);

    List<AnnouncementRead> findByUserIdAndAnnouncementIdIn(Long userId, Collection<Long> announcementIds);

    List<AnnouncementRead> findByUserId(Long userId);

    void deleteByAnnouncementId(Long announcementId);
}
