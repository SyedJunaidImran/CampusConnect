package com.campusconnect.service;

import com.campusconnect.dto.response.EnrollmentResponse;
import com.campusconnect.entity.Course;
import com.campusconnect.entity.Enrollment;
import com.campusconnect.entity.Student;
import com.campusconnect.entity.User;
import com.campusconnect.enums.Role;
import com.campusconnect.exception.DuplicateResourceException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.repository.CourseRepository;
import com.campusconnect.repository.EnrollmentRepository;
import com.campusconnect.repository.StudentRepository;
import com.campusconnect.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * EnrollmentService — manages student course enrollment and related queries.
 */
@Service
public class EnrollmentService {

    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    public EnrollmentService(EnrollmentRepository enrollmentRepository,
                             StudentRepository studentRepository,
                             CourseRepository courseRepository,
                             UserRepository userRepository) {
        this.enrollmentRepository = enrollmentRepository;
        this.studentRepository = studentRepository;
        this.courseRepository = courseRepository;
        this.userRepository = userRepository;
    }

    /**
     * Enroll the logged-in student in a course.
     * Prevents duplicate enrollment and handles non-existent course error.
     */
    @Transactional
    public EnrollmentResponse enrollStudent(String studentEmail, Long courseId) {
        Student student = studentRepository.findByUserEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for user: " + studentEmail));

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        // Validate duplicate enrollment
        if (enrollmentRepository.existsByStudentIdAndCourseId(student.getId(), course.getId())) {
            throw new DuplicateResourceException("You are already enrolled in course: " + course.getCourseCode() + " - " + course.getCourseName());
        }

        Enrollment enrollment = new Enrollment(student, course);
        Enrollment saved = enrollmentRepository.save(enrollment);

        return mapToResponse(saved);
    }

    /**
     * Unenroll the logged-in student from a course.
     */
    @Transactional
    public void unenrollStudent(String studentEmail, Long courseId) {
        Student student = studentRepository.findByUserEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for user: " + studentEmail));

        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course", "id", courseId);
        }

        if (!enrollmentRepository.existsByStudentIdAndCourseId(student.getId(), courseId)) {
            throw new ResourceNotFoundException("Enrollment not found for course id: " + courseId);
        }

        enrollmentRepository.deleteByStudentIdAndCourseId(student.getId(), courseId);
    }

    /**
     * Get all courses the logged-in student is currently enrolled in.
     */
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getStudentEnrolledCourses(String studentEmail) {
        Student student = studentRepository.findByUserEmail(studentEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for user: " + studentEmail));

        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(student.getId());
        return enrollments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get list of students enrolled in a specific course.
     * Accessible by Faculty assigned to the course or Admin.
     */
    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getEnrolledStudentsForCourse(Long courseId, String email) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        if (email != null && !email.isBlank()) {
            User user = userRepository.findByEmail(email).orElse(null);
            if (user != null && user.getRole() == Role.FACULTY) {
                if (course.getFaculty() == null || !course.getFaculty().getUser().getEmail().equals(email)) {
                    throw new SecurityException("You are not authorized to view enrolled students for course: " + course.getCourseCode());
                }
            }
        }

        List<Enrollment> enrollments = enrollmentRepository.findByCourseId(courseId);
        return enrollments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<EnrollmentResponse> getEnrolledStudentsForCourse(Long courseId) {
        return getEnrolledStudentsForCourse(courseId, null);
    }

    /**
     * Helper to map Enrollment entity to EnrollmentResponse DTO.
     */
    private EnrollmentResponse mapToResponse(Enrollment enrollment) {
        EnrollmentResponse res = new EnrollmentResponse();
        res.setId(enrollment.getId());

        // Student details
        Student student = enrollment.getStudent();
        res.setStudentId(student.getId());
        res.setStudentName(student.getUser().getFullName());
        res.setStudentEmail(student.getUser().getEmail());
        res.setStudentRollNumber(student.getRollNumber());
        res.setStudentDepartment(student.getDepartment());

        // Course details
        Course course = enrollment.getCourse();
        res.setCourseId(course.getId());
        res.setCourseCode(course.getCourseCode());
        res.setCourseName(course.getCourseName());
        res.setDepartment(course.getDepartment());
        res.setSemester(course.getSemester());
        res.setCredits(course.getCredits());

        if (course.getFaculty() != null) {
            res.setFacultyName(course.getFaculty().getUser().getFullName());
        }

        res.setEnrolledAt(enrollment.getEnrolledAt());
        return res;
    }
}
