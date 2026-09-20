package com.campusconnect.repository;

import com.campusconnect.entity.Faculty;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for Faculty entity.
 * Inherits all standard CRUD methods from JpaRepository.
 */
@Repository
public interface FacultyRepository extends JpaRepository<Faculty, Long> {

    /** Find a faculty member by their linked user ID. */
    Optional<Faculty> findByUserId(Long userId);

    /** Find a faculty member by their linked user's email address. */
    Optional<Faculty> findByUserEmail(String email);

    /** Check if a faculty member with this employee ID already exists. */
    boolean existsByEmployeeId(String employeeId);
}
