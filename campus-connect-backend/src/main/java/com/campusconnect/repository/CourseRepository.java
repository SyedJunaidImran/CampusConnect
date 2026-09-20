package com.campusconnect.repository;

import com.campusconnect.entity.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for Course entity database operations.
 */
@Repository
public interface CourseRepository extends JpaRepository<Course, Long> {

    /** Find a course by its unique course code (e.g., "CS101") */
    Optional<Course> findByCourseCode(String courseCode);

    /** Check if a course with this code already exists */
    boolean existsByCourseCode(String courseCode);

    /** Check if a course code exists for another course ID (used during update) */
    boolean existsByCourseCodeAndIdNot(String courseCode, Long id);

    /** Find all courses taught by a specific faculty member */
    List<Course> findByFacultyId(Long facultyId);

    /** Find all courses in a specific department */
    List<Course> findByDepartment(String department);

    /** Find all courses for a specific semester */
    List<Course> findBySemester(Integer semester);
}
