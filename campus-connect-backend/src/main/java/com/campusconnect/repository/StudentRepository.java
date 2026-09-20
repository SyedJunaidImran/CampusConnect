package com.campusconnect.repository;

import com.campusconnect.entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for Student entity.
 * Inherits all standard CRUD methods from JpaRepository.
 */
@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {

    /** Find a student by their linked user ID. */
    Optional<Student> findByUserId(Long userId);

    /** Find a student by their linked user's email address. */
    Optional<Student> findByUserEmail(String email);

    /** Check if a student with this roll number already exists. */
    boolean existsByRollNumber(String rollNumber);
}
