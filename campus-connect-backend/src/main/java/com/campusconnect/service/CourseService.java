package com.campusconnect.service;

import com.campusconnect.dto.request.CourseRequest;
import com.campusconnect.dto.response.CourseResponse;
import com.campusconnect.entity.Course;
import com.campusconnect.entity.Faculty;
import com.campusconnect.entity.Student;
import com.campusconnect.exception.DuplicateResourceException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.repository.CourseRepository;
import com.campusconnect.repository.EnrollmentRepository;
import com.campusconnect.repository.FacultyRepository;
import com.campusconnect.repository.StudentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * CourseService — manages academic course lifecycle and queries.
 */
@Service
public class CourseService {

    private final CourseRepository courseRepository;
    private final FacultyRepository facultyRepository;
    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;

    public CourseService(CourseRepository courseRepository,
                         FacultyRepository facultyRepository,
                         StudentRepository studentRepository,
                         EnrollmentRepository enrollmentRepository) {
        this.courseRepository = courseRepository;
        this.facultyRepository = facultyRepository;
        this.studentRepository = studentRepository;
        this.enrollmentRepository = enrollmentRepository;
    }

    /**
     * Get all courses with enrollment count and optional student-enrolled status.
     */
    @Transactional(readOnly = true)
    public List<CourseResponse> getAllCourses(String currentUserEmail) {
        List<Course> courses = courseRepository.findAll();

        Long currentStudentId = null;
        if (currentUserEmail != null) {
            currentStudentId = studentRepository.findByUserEmail(currentUserEmail)
                    .map(Student::getId)
                    .orElse(null);
        }

        final Long studentId = currentStudentId;
        return courses.stream()
                .map(course -> mapToResponse(course, studentId))
                .collect(Collectors.toList());
    }

    /**
     * Get single course details by ID.
     */
    @Transactional(readOnly = true)
    public CourseResponse getCourseById(Long id, String currentUserEmail) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", id));

        Long studentId = null;
        if (currentUserEmail != null) {
            studentId = studentRepository.findByUserEmail(currentUserEmail)
                    .map(Student::getId)
                    .orElse(null);
        }

        return mapToResponse(course, studentId);
    }

    /**
     * Create a new course (Admin only).
     */
    @Transactional
    public CourseResponse createCourse(CourseRequest request) {
        if (courseRepository.existsByCourseCode(request.getCourseCode())) {
            throw new DuplicateResourceException(
                    "Course code already exists: " + request.getCourseCode()
            );
        }

        Course course = new Course();
        course.setCourseCode(request.getCourseCode().toUpperCase().trim());
        course.setCourseName(request.getCourseName().trim());
        course.setDescription(request.getDescription());
        course.setDepartment(request.getDepartment().trim());
        course.setSemester(request.getSemester());
        course.setCredits(request.getCredits());

        if (request.getFacultyId() != null) {
            Faculty faculty = facultyRepository.findById(request.getFacultyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty", "id", request.getFacultyId()));
            course.setFaculty(faculty);
        }

        Course saved = courseRepository.save(course);
        return mapToResponse(saved, null);
    }

    /**
     * Update an existing course (Admin only).
     */
    @Transactional
    public CourseResponse updateCourse(Long id, CourseRequest request) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", id));

        // Check if new course code conflicts with another course
        if (courseRepository.existsByCourseCodeAndIdNot(request.getCourseCode().toUpperCase().trim(), id)) {
            throw new DuplicateResourceException(
                    "Course code already used by another course: " + request.getCourseCode()
            );
        }

        course.setCourseCode(request.getCourseCode().toUpperCase().trim());
        course.setCourseName(request.getCourseName().trim());
        course.setDescription(request.getDescription());
        course.setDepartment(request.getDepartment().trim());
        course.setSemester(request.getSemester());
        course.setCredits(request.getCredits());

        if (request.getFacultyId() != null) {
            Faculty faculty = facultyRepository.findById(request.getFacultyId())
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty", "id", request.getFacultyId()));
            course.setFaculty(faculty);
        } else {
            course.setFaculty(null);
        }

        Course updated = courseRepository.save(course);
        return mapToResponse(updated, null);
    }

    /**
     * Delete a course (Admin only).
     */
    @Transactional
    public void deleteCourse(Long id) {
        if (!courseRepository.existsById(id)) {
            throw new ResourceNotFoundException("Course", "id", id);
        }
        courseRepository.deleteById(id);
    }

    /**
     * Get courses assigned to a faculty member.
     */
    @Transactional(readOnly = true)
    public List<CourseResponse> getCoursesByFacultyEmail(String facultyEmail) {
        Faculty faculty = facultyRepository.findByUserEmail(facultyEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty profile not found for: " + facultyEmail));

        List<Course> courses = courseRepository.findByFacultyId(faculty.getId());
        return courses.stream()
                .map(c -> mapToResponse(c, null))
                .collect(Collectors.toList());
    }

    /**
     * Helper to convert Course entity to CourseResponse DTO.
     */
    private CourseResponse mapToResponse(Course course, Long studentId) {
        CourseResponse response = new CourseResponse();
        response.setId(course.getId());
        response.setCourseCode(course.getCourseCode());
        response.setCourseName(course.getCourseName());
        response.setDescription(course.getDescription());
        response.setDepartment(course.getDepartment());
        response.setSemester(course.getSemester());
        response.setCredits(course.getCredits());
        response.setCreatedAt(course.getCreatedAt());

        if (course.getFaculty() != null) {
            response.setFacultyId(course.getFaculty().getId());
            response.setFacultyName(course.getFaculty().getUser().getFullName());
            response.setFacultyEmail(course.getFaculty().getUser().getEmail());
            response.setFacultyDesignation(course.getFaculty().getDesignation());
        }

        long count = enrollmentRepository.countByCourseId(course.getId());
        response.setEnrolledStudentsCount(count);

        if (studentId != null) {
            boolean isEnrolled = enrollmentRepository.existsByStudentIdAndCourseId(studentId, course.getId());
            response.setIsEnrolled(isEnrolled);
        }

        return response;
    }
}
