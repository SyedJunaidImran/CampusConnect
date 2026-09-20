package com.campusconnect.service;

import com.campusconnect.dto.request.AttendanceRecordRequest;
import com.campusconnect.dto.request.AttendanceUpdateRequest;
import com.campusconnect.dto.request.BatchAttendanceRequest;
import com.campusconnect.dto.response.AttendanceResponse;
import com.campusconnect.dto.response.CourseAttendanceSummaryResponse;
import com.campusconnect.dto.response.DateAttendanceSheetResponse;
import com.campusconnect.dto.response.StudentOverallAttendanceResponse;
import com.campusconnect.entity.Attendance;
import com.campusconnect.entity.Course;
import com.campusconnect.entity.Enrollment;
import com.campusconnect.entity.Faculty;
import com.campusconnect.entity.Student;
import com.campusconnect.enums.AttendanceStatus;
import com.campusconnect.enums.Role;
import com.campusconnect.exception.DuplicateResourceException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.repository.AttendanceRepository;
import com.campusconnect.repository.CourseRepository;
import com.campusconnect.repository.EnrollmentRepository;
import com.campusconnect.repository.FacultyRepository;
import com.campusconnect.repository.StudentRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * AttendanceService — manages attendance marking, updating, verification, and percentage calculations.
 */
@Service
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final CourseRepository courseRepository;
    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final FacultyRepository facultyRepository;

    public AttendanceService(AttendanceRepository attendanceRepository,
                             CourseRepository courseRepository,
                             StudentRepository studentRepository,
                             EnrollmentRepository enrollmentRepository,
                             FacultyRepository facultyRepository) {
        this.attendanceRepository = attendanceRepository;
        this.courseRepository = courseRepository;
        this.studentRepository = studentRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.facultyRepository = facultyRepository;
    }

    /**
     * Mark or update batch attendance for a course on a specific date.
     * Faculty must be assigned to the course (Admin has full access).
     */
    @Transactional
    public DateAttendanceSheetResponse submitBatchAttendance(String userEmail, Role userRole, BatchAttendanceRequest request) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", request.getCourseId()));

        // Faculty authorization check
        validateFacultyCourseOwnership(course, userEmail, userRole);

        List<AttendanceResponse> savedResponses = new ArrayList<>();
        int presentCount = 0;
        int absentCount = 0;

        for (AttendanceRecordRequest item : request.getRecords()) {
            Student student = studentRepository.findById(item.getStudentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Student", "id", item.getStudentId()));

            // Validate that the student is actually enrolled in this course
            if (!enrollmentRepository.existsByStudentIdAndCourseId(student.getId(), course.getId())) {
                throw new DuplicateResourceException("Student " + student.getRollNumber() + " (" + student.getUser().getFullName() + ") is not enrolled in course " + course.getCourseCode());
            }

            // Check if record exists for (student, course, date) -> update or insert (upsert)
            Optional<Attendance> existing = attendanceRepository.findByStudentIdAndCourseIdAndAttendanceDate(
                    student.getId(), course.getId(), request.getAttendanceDate()
            );

            Attendance record;
            if (existing.isPresent()) {
                record = existing.get();
                record.setStatus(item.getStatus());
            } else {
                record = new Attendance(student, course, request.getAttendanceDate(), item.getStatus());
            }

            Attendance saved = attendanceRepository.save(record);
            savedResponses.add(mapToResponse(saved));

            if (saved.getStatus() == AttendanceStatus.PRESENT) {
                presentCount++;
            } else {
                absentCount++;
            }
        }

        int total = savedResponses.size();
        double dailyPercentage = total > 0 ? Math.round(((double) presentCount / total) * 1000.0) / 10.0 : 0.0;

        return new DateAttendanceSheetResponse(
                course.getId(),
                course.getCourseCode(),
                course.getCourseName(),
                request.getAttendanceDate(),
                total,
                presentCount,
                absentCount,
                dailyPercentage,
                savedResponses
        );
    }

    /**
     * Update an existing single attendance record's status.
     */
    @Transactional
    public AttendanceResponse updateAttendanceRecord(String userEmail, Role userRole, Long attendanceId, AttendanceUpdateRequest request) {
        Attendance record = attendanceRepository.findById(attendanceId)
                .orElseThrow(() -> new ResourceNotFoundException("Attendance", "id", attendanceId));

        validateFacultyCourseOwnership(record.getCourse(), userEmail, userRole);

        record.setStatus(request.getStatus());
        Attendance updated = attendanceRepository.save(record);
        return mapToResponse(updated);
    }

    /**
     * Get attendance sheet for a course on a date.
     * If attendance was not marked yet for a student, includes student with null or default status so UI can render the marking sheet!
     */
    @Transactional(readOnly = true)
    public DateAttendanceSheetResponse getCourseAttendanceOnDate(String userEmail, Role userRole, Long courseId, LocalDate date) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        validateFacultyCourseOwnership(course, userEmail, userRole);

        List<Enrollment> enrollments = enrollmentRepository.findByCourseId(courseId);
        List<Attendance> existingRecords = attendanceRepository.findByCourseIdAndAttendanceDate(courseId, date);

        List<AttendanceResponse> sheetResponses = new ArrayList<>();
        int present = 0;
        int absent = 0;

        for (Enrollment enrollment : enrollments) {
            Student student = enrollment.getStudent();
            Optional<Attendance> existing = existingRecords.stream()
                    .filter(a -> a.getStudent().getId().equals(student.getId()))
                    .findFirst();

            if (existing.isPresent()) {
                Attendance a = existing.get();
                sheetResponses.add(mapToResponse(a));
                if (a.getStatus() == AttendanceStatus.PRESENT) present++;
                else absent++;
            } else {
                // Not marked yet for this date — provide student entry for form
                AttendanceResponse placeholder = new AttendanceResponse();
                placeholder.setStudentId(student.getId());
                placeholder.setStudentName(student.getUser().getFullName());
                placeholder.setStudentRollNumber(student.getRollNumber());
                placeholder.setStudentDepartment(student.getDepartment());
                placeholder.setCourseId(course.getId());
                placeholder.setCourseCode(course.getCourseCode());
                placeholder.setCourseName(course.getCourseName());
                placeholder.setAttendanceDate(date);
                placeholder.setStatus(null); // not marked yet
                sheetResponses.add(placeholder);
            }
        }

        int total = enrollments.size();
        int markedCount = present + absent;
        double dailyPercentage = markedCount > 0 ? Math.round(((double) present / markedCount) * 1000.0) / 10.0 : 0.0;

        return new DateAttendanceSheetResponse(
                course.getId(),
                course.getCourseCode(),
                course.getCourseName(),
                date,
                total,
                present,
                absent,
                dailyPercentage,
                sheetResponses
        );
    }

    /**
     * Get distinct dates on which attendance was conducted for a course.
     * Faculty can only query for assigned courses; Admin can query any.
     */
    @Transactional(readOnly = true)
    public List<LocalDate> getCourseAttendanceDates(Long courseId, String userEmail, Role userRole) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        if (userRole != null && userEmail != null) {
            validateFacultyCourseOwnership(course, userEmail, userRole);
        }

        return attendanceRepository.findDistinctAttendanceDatesByCourseId(courseId);
    }

    @Transactional(readOnly = true)
    public List<LocalDate> getCourseAttendanceDates(Long courseId) {
        return getCourseAttendanceDates(courseId, null, null);
    }

    /**
     * Get complete attendance overview for the logged-in student.
     * Calculates overall %, course-wise %, and 75% warning flag.
     */
    @Transactional(readOnly = true)
    public StudentOverallAttendanceResponse getStudentOverallAttendance(String studentEmail) {
        Student student = studentRepository.findByUserEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found for email: " + studentEmail));

        return buildStudentAttendanceSummary(student);
    }

    /**
     * Get student attendance overview by student ID (for Admin or Faculty).
     * Faculty can only view students enrolled in at least one of their assigned courses.
     */
    @Transactional(readOnly = true)
    public StudentOverallAttendanceResponse getStudentAttendanceById(Long studentId, String userEmail, Role userRole) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", studentId));

        if (userRole == Role.FACULTY && userEmail != null) {
            Faculty faculty = facultyRepository.findByUserEmail(userEmail).orElse(null);
            if (faculty != null) {
                List<Course> facultyCourses = courseRepository.findByFacultyId(faculty.getId());
                boolean teachesStudent = facultyCourses.stream()
                        .anyMatch(c -> enrollmentRepository.existsByStudentIdAndCourseId(student.getId(), c.getId()));
                if (!teachesStudent) {
                    throw new AccessDeniedException("You are not authorized to view attendance summaries for students not enrolled in your courses");
                }
            }
        }

        return buildStudentAttendanceSummary(student);
    }

    @Transactional(readOnly = true)
    public StudentOverallAttendanceResponse getStudentAttendanceById(Long studentId) {
        return getStudentAttendanceById(studentId, null, Role.ADMIN);
    }

    /**
     * Get student's detailed attendance history for a specific course.
     */
    @Transactional(readOnly = true)
    public List<AttendanceResponse> getStudentCourseAttendanceHistory(String studentEmail, Long courseId) {
        Student student = studentRepository.findByUserEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found for email: " + studentEmail));

        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course", "id", courseId);
        }

        List<Attendance> records = attendanceRepository.findByStudentIdAndCourseIdOrderByAttendanceDateDesc(student.getId(), courseId);
        return records.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    /**
     * Helper to compute attendance summary across all enrolled courses for a student.
     */
    private StudentOverallAttendanceResponse buildStudentAttendanceSummary(Student student) {
        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(student.getId());

        List<CourseAttendanceSummaryResponse> courseSummaries = new ArrayList<>();
        long totalClassesAllCourses = 0;
        long totalAttendedAllCourses = 0;
        boolean hasLowWarning = false;

        for (Enrollment enrollment : enrollments) {
            Course course = enrollment.getCourse();
            long totalClasses = attendanceRepository.countByStudentIdAndCourseId(student.getId(), course.getId());
            long attendedClasses = attendanceRepository.countByStudentIdAndCourseIdAndStatus(student.getId(), course.getId(), AttendanceStatus.PRESENT);
            long missedClasses = totalClasses - attendedClasses;

            double percentage = totalClasses > 0
                    ? Math.round(((double) attendedClasses / totalClasses) * 1000.0) / 10.0
                    : 0.0;

            boolean lowAttendance = totalClasses > 0 && percentage < 75.0;
            if (lowAttendance) {
                hasLowWarning = true;
            }

            totalClassesAllCourses += totalClasses;
            totalAttendedAllCourses += attendedClasses;

            String facultyName = course.getFaculty() != null ? course.getFaculty().getUser().getFullName() : "To be assigned";

            courseSummaries.add(new CourseAttendanceSummaryResponse(
                    course.getId(),
                    course.getCourseCode(),
                    course.getCourseName(),
                    course.getDepartment(),
                    course.getSemester(),
                    course.getCredits(),
                    facultyName,
                    totalClasses,
                    attendedClasses,
                    missedClasses,
                    percentage,
                    lowAttendance
            ));
        }

        long totalMissedAllCourses = totalClassesAllCourses - totalAttendedAllCourses;
        double overallPercentage = totalClassesAllCourses > 0
                ? Math.round(((double) totalAttendedAllCourses / totalClassesAllCourses) * 1000.0) / 10.0
                : 0.0;

        if (totalClassesAllCourses > 0 && overallPercentage < 75.0) {
            hasLowWarning = true;
        }

        List<Attendance> recentList = attendanceRepository.findByStudentIdOrderByAttendanceDateDesc(student.getId());
        List<AttendanceResponse> recentRecords = recentList.stream()
                .limit(10)
                .map(this::mapToResponse)
                .collect(Collectors.toList());

        return new StudentOverallAttendanceResponse(
                student.getId(),
                student.getUser().getFullName(),
                student.getRollNumber(),
                student.getDepartment(),
                student.getSemester(),
                totalClassesAllCourses,
                totalAttendedAllCourses,
                totalMissedAllCourses,
                overallPercentage,
                hasLowWarning,
                courseSummaries,
                recentRecords
        );
    }

    /**
     * Validates that if the caller is Faculty, they are assigned to the specified course.
     */
    private void validateFacultyCourseOwnership(Course course, String userEmail, Role userRole) {
        if (userRole == Role.ADMIN) {
            return; // Admin can manage all
        }

        if (userRole == Role.FACULTY) {
            if (course.getFaculty() == null || !course.getFaculty().getUser().getEmail().equals(userEmail)) {
                throw new AccessDeniedException("You are not assigned to instruct course: " + course.getCourseCode());
            }
            return;
        }

        throw new AccessDeniedException("Unauthorized to mark or modify attendance");
    }

    /**
     * Map Attendance entity to AttendanceResponse DTO.
     */
    private AttendanceResponse mapToResponse(Attendance a) {
        AttendanceResponse res = new AttendanceResponse();
        res.setId(a.getId());
        res.setStudentId(a.getStudent().getId());
        res.setStudentName(a.getStudent().getUser().getFullName());
        res.setStudentRollNumber(a.getStudent().getRollNumber());
        res.setStudentDepartment(a.getStudent().getDepartment());
        res.setCourseId(a.getCourse().getId());
        res.setCourseCode(a.getCourse().getCourseCode());
        res.setCourseName(a.getCourse().getCourseName());
        res.setAttendanceDate(a.getAttendanceDate());
        res.setStatus(a.getStatus());
        res.setMarkedAt(a.getMarkedAt());
        res.setUpdatedAt(a.getUpdatedAt());
        return res;
    }
}
