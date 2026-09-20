package com.campusconnect.service;

import com.campusconnect.dto.request.ClassScheduleRequest;
import com.campusconnect.dto.response.ClassScheduleResponse;
import com.campusconnect.entity.*;
import com.campusconnect.enums.DayOfWeek;
import com.campusconnect.enums.Role;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.exception.ScheduleConflictException;
import com.campusconnect.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service managing timetable class scheduling and conflict detection.
 */
@Service
public class ClassScheduleService {

    private final ClassScheduleRepository classScheduleRepository;
    private final CourseRepository courseRepository;
    private final FacultyRepository facultyRepository;
    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;

    public ClassScheduleService(ClassScheduleRepository classScheduleRepository,
                                CourseRepository courseRepository,
                                FacultyRepository facultyRepository,
                                StudentRepository studentRepository,
                                EnrollmentRepository enrollmentRepository,
                                UserRepository userRepository) {
        this.classScheduleRepository = classScheduleRepository;
        this.courseRepository = courseRepository;
        this.facultyRepository = facultyRepository;
        this.studentRepository = studentRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
    }

    /**
     * Create a new class schedule (Admin only).
     * Enforces three-way conflict detection (Room, Faculty, Course overlaps).
     */
    @Transactional
    public ClassScheduleResponse createSchedule(ClassScheduleRequest request) {
        validateTime(request.getStartTime(), request.getEndTime());

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", request.getCourseId()));

        Faculty faculty = facultyRepository.findById(request.getFacultyId())
                .orElseThrow(() -> new ResourceNotFoundException("Faculty", "id", request.getFacultyId()));

        // Run Conflict Detection
        validateConflicts(
                request.getDayOfWeek(),
                request.getStartTime(),
                request.getEndTime(),
                request.getRoom().trim(),
                faculty.getId(),
                course.getId(),
                null
        );

        ClassSchedule schedule = new ClassSchedule();
        schedule.setCourse(course);
        schedule.setFaculty(faculty);
        schedule.setDayOfWeek(request.getDayOfWeek());
        schedule.setStartTime(request.getStartTime());
        schedule.setEndTime(request.getEndTime());
        schedule.setRoom(request.getRoom().trim());
        schedule.setSemester(request.getSemester());
        schedule.setDepartment(request.getDepartment().trim());

        ClassSchedule saved = classScheduleRepository.save(schedule);
        return mapToResponse(saved);
    }

    /**
     * Update an existing class schedule (Admin only).
     */
    @Transactional
    public ClassScheduleResponse updateSchedule(Long id, ClassScheduleRequest request) {
        ClassSchedule schedule = classScheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Class schedule", "id", id));

        validateTime(request.getStartTime(), request.getEndTime());

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", request.getCourseId()));

        Faculty faculty = facultyRepository.findById(request.getFacultyId())
                .orElseThrow(() -> new ResourceNotFoundException("Faculty", "id", request.getFacultyId()));

        // Run Conflict Detection (excluding current schedule ID)
        validateConflicts(
                request.getDayOfWeek(),
                request.getStartTime(),
                request.getEndTime(),
                request.getRoom().trim(),
                faculty.getId(),
                course.getId(),
                id
        );

        schedule.setCourse(course);
        schedule.setFaculty(faculty);
        schedule.setDayOfWeek(request.getDayOfWeek());
        schedule.setStartTime(request.getStartTime());
        schedule.setEndTime(request.getEndTime());
        schedule.setRoom(request.getRoom().trim());
        schedule.setSemester(request.getSemester());
        schedule.setDepartment(request.getDepartment().trim());

        ClassSchedule updated = classScheduleRepository.save(schedule);
        return mapToResponse(updated);
    }

    /**
     * Delete a class schedule (Admin only).
     */
    @Transactional
    public void deleteSchedule(Long id) {
        ClassSchedule schedule = classScheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Class schedule", "id", id));
        classScheduleRepository.delete(schedule);
    }

    /**
     * Get a single schedule by ID.
     */
    @Transactional(readOnly = true)
    public ClassScheduleResponse getScheduleById(Long id) {
        ClassSchedule schedule = classScheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Class schedule", "id", id));
        return mapToResponse(schedule);
    }

    /**
     * Get all schedules with optional filters (Admin).
     */
    @Transactional(readOnly = true)
    public List<ClassScheduleResponse> getAllSchedules(DayOfWeek day,
                                                      Long courseId,
                                                      Long facultyId,
                                                      String room,
                                                      Integer semester,
                                                      String department) {
        return classScheduleRepository.findAll().stream()
                .filter(s -> day == null || s.getDayOfWeek() == day)
                .filter(s -> courseId == null || (s.getCourse() != null && s.getCourse().getId().equals(courseId)))
                .filter(s -> facultyId == null || (s.getFaculty() != null && s.getFaculty().getId().equals(facultyId)))
                .filter(s -> room == null || (s.getRoom() != null && s.getRoom().equalsIgnoreCase(room.trim())))
                .filter(s -> semester == null || (s.getSemester() != null && s.getSemester().equals(semester)))
                .filter(s -> department == null || (s.getDepartment() != null && s.getDepartment().equalsIgnoreCase(department.trim())))
                .sorted(getScheduleComparator())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get all schedules for a specific day.
     */
    @Transactional(readOnly = true)
    public List<ClassScheduleResponse> getSchedulesByDay(DayOfWeek day) {
        return classScheduleRepository.findByDayOfWeek(day).stream()
                .sorted(getScheduleComparator())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get all schedules for a specific course.
     */
    @Transactional(readOnly = true)
    public List<ClassScheduleResponse> getSchedulesByCourse(Long courseId) {
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course", "id", courseId);
        }
        return classScheduleRepository.findByCourseId(courseId).stream()
                .sorted(getScheduleComparator())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get teaching schedule for logged-in faculty.
     */
    @Transactional(readOnly = true)
    public List<ClassScheduleResponse> getFacultySchedules(String email) {
        Faculty faculty = facultyRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty profile not found for: " + email));

        return classScheduleRepository.findByFacultyId(faculty.getId()).stream()
                .sorted(getScheduleComparator())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get timetable for logged-in student (across enrolled courses).
     */
    @Transactional(readOnly = true)
    public List<ClassScheduleResponse> getStudentSchedules(String email) {
        Student student = studentRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for: " + email));

        List<Long> courseIds = enrollmentRepository.findByStudentId(student.getId()).stream()
                .map(e -> e.getCourse().getId())
                .collect(Collectors.toList());

        if (courseIds.isEmpty()) {
            return List.of();
        }

        return classScheduleRepository.findByCourseIdIn(courseIds).stream()
                .sorted(getScheduleComparator())
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get today's class schedule based on current user role.
     */
    @Transactional(readOnly = true)
    public List<ClassScheduleResponse> getTodaySchedules(String email) {
        DayOfWeek today = getCurrentDayOfWeek();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));

        if (user.getRole() == Role.STUDENT) {
            Student student = studentRepository.findByUserEmail(email).orElse(null);
            if (student == null) return List.of();

            List<Long> courseIds = enrollmentRepository.findByStudentId(student.getId()).stream()
                    .map(e -> e.getCourse().getId())
                    .collect(Collectors.toList());

            if (courseIds.isEmpty()) return List.of();

            return classScheduleRepository.findByCourseIdInAndDayOfWeek(courseIds, today).stream()
                    .sorted(getScheduleComparator())
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        } else if (user.getRole() == Role.FACULTY) {
            Faculty faculty = facultyRepository.findByUserEmail(email).orElse(null);
            if (faculty == null) return List.of();

            return classScheduleRepository.findByFacultyIdAndDayOfWeek(faculty.getId(), today).stream()
                    .sorted(getScheduleComparator())
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        } else {
            // ADMIN
            return classScheduleRepository.findByDayOfWeek(today).stream()
                    .sorted(getScheduleComparator())
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        }
    }

    /**
     * Get today's remaining / upcoming classes for the logged-in user.
     */
    @Transactional(readOnly = true)
    public List<ClassScheduleResponse> getUpcomingClasses(String email) {
        List<ClassScheduleResponse> todayClasses = getTodaySchedules(email);
        LocalTime now = LocalTime.now();

        return todayClasses.stream()
                .filter(c -> c.getEndTime() != null && c.getEndTime().isAfter(now))
                .sorted(Comparator.comparing(ClassScheduleResponse::getStartTime, Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    // ==================== HELPER METHODS ====================

    /**
     * Three-Way Conflict Detection Logic:
     * 1. Room Conflict: Is the room occupied at overlapping time?
     * 2. Faculty Conflict: Is the professor teaching another class at overlapping time?
     * 3. Course Conflict: Is the course already scheduled at overlapping time?
     */
    private void validateConflicts(DayOfWeek day,
                                   LocalTime startTime,
                                   LocalTime endTime,
                                   String room,
                                   Long facultyId,
                                   Long courseId,
                                   Long excludeId) {

        // 1. Room Conflict Check
        List<ClassSchedule> roomSchedules = classScheduleRepository.findByDayOfWeekAndRoom(day, room);
        for (ClassSchedule existing : roomSchedules) {
            if (excludeId != null && existing.getId().equals(excludeId)) {
                continue;
            }
            if (isTimeOverlapping(startTime, endTime, existing.getStartTime(), existing.getEndTime())) {
                String courseCode = existing.getCourse() != null ? existing.getCourse().getCourseCode() : "Unknown Course";
                String courseName = existing.getCourse() != null ? existing.getCourse().getCourseName() : "";
                throw new ScheduleConflictException(String.format(
                        "Room '%s' is already occupied on %s from %s to %s by %s (%s).",
                        room, day, existing.getStartTime(), existing.getEndTime(),
                        courseCode, courseName
                ));
            }
        }

        // 2. Faculty Conflict Check
        List<ClassSchedule> facultySchedules = classScheduleRepository.findByDayOfWeekAndFacultyId(day, facultyId);
        for (ClassSchedule existing : facultySchedules) {
            if (excludeId != null && existing.getId().equals(excludeId)) {
                continue;
            }
            if (isTimeOverlapping(startTime, endTime, existing.getStartTime(), existing.getEndTime())) {
                String facultyName = (existing.getFaculty() != null && existing.getFaculty().getUser() != null)
                        ? existing.getFaculty().getUser().getFullName() : "Faculty";
                String courseCode = existing.getCourse() != null ? existing.getCourse().getCourseCode() : "Unknown Course";
                String courseName = existing.getCourse() != null ? existing.getCourse().getCourseName() : "";
                throw new ScheduleConflictException(String.format(
                        "Faculty member '%s' is already scheduled to teach %s (%s) on %s from %s to %s in %s.",
                        facultyName, courseCode, courseName,
                        day, existing.getStartTime(), existing.getEndTime(), existing.getRoom()
                ));
            }
        }

        // 3. Course Conflict Check
        List<ClassSchedule> courseSchedules = classScheduleRepository.findByDayOfWeekAndCourseId(day, courseId);
        for (ClassSchedule existing : courseSchedules) {
            if (excludeId != null && existing.getId().equals(excludeId)) {
                continue;
            }
            if (isTimeOverlapping(startTime, endTime, existing.getStartTime(), existing.getEndTime())) {
                String courseCode = existing.getCourse() != null ? existing.getCourse().getCourseCode() : "Unknown Course";
                String courseName = existing.getCourse() != null ? existing.getCourse().getCourseName() : "";
                throw new ScheduleConflictException(String.format(
                        "Course %s (%s) is already scheduled on %s from %s to %s in %s.",
                        courseCode, courseName,
                        day, existing.getStartTime(), existing.getEndTime(), existing.getRoom()
                ));
            }
        }
    }

    /**
     * Check if two time intervals overlap: (start1 < end2 && end1 > start2)
     */
    private boolean isTimeOverlapping(LocalTime start1, LocalTime end1, LocalTime start2, LocalTime end2) {
        if (start1 == null || end1 == null || start2 == null || end2 == null) {
            return false;
        }
        return start1.isBefore(end2) && end1.isAfter(start2);
    }

    private void validateTime(LocalTime start, LocalTime end) {
        if (start == null || end == null) {
            throw new IllegalArgumentException("Start time and end time are required");
        }
        if (!start.isBefore(end)) {
            throw new IllegalArgumentException(String.format(
                    "Start time (%s) must be before end time (%s)", start, end
            ));
        }
    }

    private DayOfWeek getCurrentDayOfWeek() {
        java.time.DayOfWeek javaDay = LocalDate.now().getDayOfWeek();
        return DayOfWeek.valueOf(javaDay.name());
    }

    private Comparator<ClassSchedule> getScheduleComparator() {
        return Comparator.comparing(ClassSchedule::getDayOfWeek, Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(ClassSchedule::getStartTime, Comparator.nullsLast(Comparator.naturalOrder()));
    }

    private ClassScheduleResponse mapToResponse(ClassSchedule s) {
        ClassScheduleResponse res = new ClassScheduleResponse();
        res.setId(s.getId());
        if (s.getCourse() != null) {
            res.setCourseId(s.getCourse().getId());
            res.setCourseCode(s.getCourse().getCourseCode());
            res.setCourseName(s.getCourse().getCourseName());
        }
        if (s.getFaculty() != null) {
            res.setFacultyId(s.getFaculty().getId());
            if (s.getFaculty().getUser() != null) {
                res.setFacultyName(s.getFaculty().getUser().getFullName());
                res.setFacultyEmail(s.getFaculty().getUser().getEmail());
            }
        }
        res.setDayOfWeek(s.getDayOfWeek());
        res.setStartTime(s.getStartTime());
        res.setEndTime(s.getEndTime());
        res.setRoom(s.getRoom());
        res.setSemester(s.getSemester());
        res.setDepartment(s.getDepartment());
        res.setCreatedAt(s.getCreatedAt());
        res.setUpdatedAt(s.getUpdatedAt());
        return res;
    }
}
