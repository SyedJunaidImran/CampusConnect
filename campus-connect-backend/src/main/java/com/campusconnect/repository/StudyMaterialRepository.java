package com.campusconnect.repository;

import com.campusconnect.entity.StudyMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository interface for StudyMaterial database operations.
 */
@Repository
public interface StudyMaterialRepository extends JpaRepository<StudyMaterial, Long> {

    List<StudyMaterial> findByCourseId(Long courseId);

    List<StudyMaterial> findByCourseIdIn(List<Long> courseIds);

    List<StudyMaterial> findByFacultyId(Long facultyId);

    long countByCourseId(Long courseId);

    long countByCourseIdIn(java.util.Collection<Long> courseIds);
}
