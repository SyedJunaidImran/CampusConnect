package com.campusconnect.repository;

import com.campusconnect.entity.ClassSchedule;
import com.campusconnect.enums.DayOfWeek;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Repository for ClassSchedule entity database operations.
 */
@Repository
public interface ClassScheduleRepository extends JpaRepository<ClassSchedule, Long> {

    /** Find all schedules for a specific day of the week */
    List<ClassSchedule> findByDayOfWeek(DayOfWeek dayOfWeek);

    /** Find all schedules for a specific course */
    List<ClassSchedule> findByCourseId(Long courseId);

    /** Find all schedules taught by a specific faculty member */
    List<ClassSchedule> findByFacultyId(Long facultyId);

    /** Find all schedules taught by a faculty member on a given day */
    List<ClassSchedule> findByFacultyIdAndDayOfWeek(Long facultyId, DayOfWeek dayOfWeek);

    /** Find all schedules taught by a faculty member on a given day */
    List<ClassSchedule> findByDayOfWeekAndFacultyId(DayOfWeek dayOfWeek, Long facultyId);

    /** Find all schedules for a specific room */
    List<ClassSchedule> findByRoom(String room);

    /** Find all schedules for a specific room on a given day (used for room conflict check) */
    List<ClassSchedule> findByDayOfWeekAndRoom(DayOfWeek dayOfWeek, String room);

    /** Find all schedules for a course on a given day (used for course conflict check) */
    List<ClassSchedule> findByDayOfWeekAndCourseId(DayOfWeek dayOfWeek, Long courseId);

    /** Find all schedules for a semester */
    List<ClassSchedule> findBySemester(Integer semester);

    /** Find all schedules for a department */
    List<ClassSchedule> findByDepartment(String department);

    /** Find all schedules for student's enrolled courses */
    List<ClassSchedule> findByCourseIdIn(List<Long> courseIds);

    /** Find all schedules for student's enrolled courses on a specific day */
    List<ClassSchedule> findByCourseIdInAndDayOfWeek(List<Long> courseIds, DayOfWeek dayOfWeek);

    /** Count total schedules assigned to a faculty */
    long countByFacultyId(Long facultyId);

    /** Count total schedules for a course */
    long countByCourseId(Long courseId);
}
