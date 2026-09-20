package com.campusconnect.repository;

import com.campusconnect.entity.Attendance;
import com.campusconnect.enums.AttendanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * Repository for Attendance entity queries.
 */
@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {

    /** Find all attendance entries for a course on a specific date */
    List<Attendance> findByCourseIdAndAttendanceDate(Long courseId, LocalDate attendanceDate);

    /** Find all attendance records for a student across all courses, ordered by date descending */
    List<Attendance> findByStudentIdOrderByAttendanceDateDesc(Long studentId);

    /** Find all attendance records for a student in a specific course, ordered by date descending */
    List<Attendance> findByStudentIdAndCourseIdOrderByAttendanceDateDesc(Long studentId, Long courseId);

    /** Find a specific student's attendance record in a course on a date */
    Optional<Attendance> findByStudentIdAndCourseIdAndAttendanceDate(Long studentId, Long courseId, LocalDate attendanceDate);

    /** Check if an attendance record exists for student, course, and date */
    boolean existsByStudentIdAndCourseIdAndAttendanceDate(Long studentId, Long courseId, LocalDate attendanceDate);

    /** Count total classes held for a course that a student has records for */
    long countByStudentIdAndCourseId(Long studentId, Long courseId);

    /** Count attended classes (PRESENT) for a student in a specific course */
    long countByStudentIdAndCourseIdAndStatus(Long studentId, Long courseId, AttendanceStatus status);

    /** Count total classes for a student across all enrolled courses */
    long countByStudentId(Long studentId);

    /** Count total PRESENT classes for a student across all courses */
    long countByStudentIdAndStatus(Long studentId, AttendanceStatus status);

    /** Find all attendance records for a course ordered by date desc */
    List<Attendance> findByCourseIdOrderByAttendanceDateDesc(Long courseId);

    /** Get distinct dates for which attendance was marked for a course */
    @Query("SELECT DISTINCT a.attendanceDate FROM Attendance a WHERE a.course.id = :courseId ORDER BY a.attendanceDate DESC")
    List<LocalDate> findDistinctAttendanceDatesByCourseId(@Param("courseId") Long courseId);

    /** Count total attendance records by status across all courses */
    long countByStatus(AttendanceStatus status);

    /** Count total attendance records for a course */
    long countByCourseId(Long courseId);

    /** Count attendance records by course and status */
    long countByCourseIdAndStatus(Long courseId, AttendanceStatus status);

    /** Count attendance records across multiple courses */
    long countByCourseIdIn(java.util.Collection<Long> courseIds);

    /** Count attendance records across multiple courses by status */
    long countByCourseIdInAndStatus(java.util.Collection<Long> courseIds, AttendanceStatus status);
}
