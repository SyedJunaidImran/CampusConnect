package com.campusconnect.service;

import com.campusconnect.dto.request.AssignmentRequest;
import com.campusconnect.dto.response.AssignmentResponse;
import com.campusconnect.dto.response.AssignmentStatisticsResponse;
import com.campusconnect.entity.*;
import com.campusconnect.enums.Role;
import com.campusconnect.enums.SubmissionStatus;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * AssignmentService — manages assignment lifecycle and queries.
 * Authorization is enforced via JWT identity, not client-supplied IDs.
 */
@Service
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository submissionRepository;
    private final CourseRepository courseRepository;
    private final FacultyRepository facultyRepository;
    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;

    public AssignmentService(AssignmentRepository assignmentRepository,
                             AssignmentSubmissionRepository submissionRepository,
                             CourseRepository courseRepository,
                             FacultyRepository facultyRepository,
                             StudentRepository studentRepository,
                             EnrollmentRepository enrollmentRepository,
                             UserRepository userRepository) {
        this.assignmentRepository = assignmentRepository;
        this.submissionRepository = submissionRepository;
        this.courseRepository = courseRepository;
        this.facultyRepository = facultyRepository;
        this.studentRepository = studentRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
    }

    /**
     * Create a new assignment (Faculty or Admin).
     * Faculty can only create for courses assigned to them.
     */
    @Transactional
    public AssignmentResponse createAssignment(String email, AssignmentRequest request) {
        User user = getUserByEmail(email);
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", request.getCourseId()));

        Faculty faculty;
        if (user.getRole() == Role.ADMIN) {
            // Admin can create for any course — use the course's assigned faculty
            if (course.getFaculty() == null) {
                throw new IllegalArgumentException("Course has no assigned faculty. Assign a faculty first.");
            }
            faculty = course.getFaculty();
        } else {
            // Faculty — must be assigned to this course
            faculty = facultyRepository.findByUserEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty profile not found for: " + email));
            if (course.getFaculty() == null || !course.getFaculty().getId().equals(faculty.getId())) {
                throw new SecurityException("You are not assigned to this course");
            }
        }

        Assignment assignment = new Assignment();
        assignment.setTitle(request.getTitle().trim());
        assignment.setDescription(request.getDescription());
        assignment.setCourse(course);
        assignment.setFaculty(faculty);
        assignment.setDueDate(request.getDueDate());
        assignment.setTotalMarks(request.getTotalMarks());

        Assignment saved = assignmentRepository.save(assignment);
        return mapToResponse(saved, null);
    }

    /**
     * Get a single assignment by ID.
     */
    @Transactional(readOnly = true)
    public AssignmentResponse getAssignmentById(Long id, String email) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", "id", id));

        Long studentId = getStudentIdIfStudent(email);
        return mapToResponse(assignment, studentId);
    }

    /**
     * Get all assignments for a course.
     */
    @Transactional(readOnly = true)
    public List<AssignmentResponse> getAssignmentsByCourse(Long courseId, String email) {
        if (!courseRepository.existsById(courseId)) {
            throw new ResourceNotFoundException("Course", "id", courseId);
        }
        Long studentId = getStudentIdIfStudent(email);
        return assignmentRepository.findByCourseId(courseId).stream()
                .map(a -> mapToResponse(a, studentId))
                .collect(Collectors.toList());
    }

    /**
     * Get assignments for logged-in student (across enrolled courses).
     */
    @Transactional(readOnly = true)
    public List<AssignmentResponse> getAssignmentsForStudent(String email) {
        Student student = studentRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for: " + email));

        List<Long> courseIds = enrollmentRepository.findByStudentId(student.getId()).stream()
                .map(e -> e.getCourse().getId())
                .collect(Collectors.toList());

        if (courseIds.isEmpty()) {
            return List.of();
        }

        return assignmentRepository.findByCourseIdIn(courseIds).stream()
                .map(a -> mapToResponse(a, student.getId()))
                .collect(Collectors.toList());
    }

    /**
     * Get assignments created by logged-in faculty.
     */
    @Transactional(readOnly = true)
    public List<AssignmentResponse> getAssignmentsForFaculty(String email) {
        Faculty faculty = facultyRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty profile not found for: " + email));
        return assignmentRepository.findByFacultyId(faculty.getId()).stream()
                .map(a -> mapToResponse(a, null))
                .collect(Collectors.toList());
    }

    /**
     * Get all assignments (Admin).
     */
    @Transactional(readOnly = true)
    public List<AssignmentResponse> getAllAssignments() {
        return assignmentRepository.findAll().stream()
                .map(a -> mapToResponse(a, null))
                .collect(Collectors.toList());
    }

    /**
     * Update an assignment (Faculty for own, Admin for any).
     */
    @Transactional
    public AssignmentResponse updateAssignment(String email, Long id, AssignmentRequest request) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", "id", id));

        User user = getUserByEmail(email);
        if (user.getRole() != Role.ADMIN) {
            Faculty faculty = facultyRepository.findByUserEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty profile not found for: " + email));
            if (!assignment.getFaculty().getId().equals(faculty.getId())) {
                throw new SecurityException("You can only update your own assignments");
            }
        }

        // Allow course change — validate
        if (!assignment.getCourse().getId().equals(request.getCourseId())) {
            Course newCourse = courseRepository.findById(request.getCourseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Course", "id", request.getCourseId()));
            assignment.setCourse(newCourse);
        }

        assignment.setTitle(request.getTitle().trim());
        assignment.setDescription(request.getDescription());
        assignment.setDueDate(request.getDueDate());
        assignment.setTotalMarks(request.getTotalMarks());

        Assignment updated = assignmentRepository.save(assignment);
        return mapToResponse(updated, null);
    }

    /**
     * Delete an assignment (Faculty for own, Admin for any).
     */
    @Transactional
    public void deleteAssignment(String email, Long id) {
        Assignment assignment = assignmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", "id", id));

        User user = getUserByEmail(email);
        if (user.getRole() != Role.ADMIN) {
            Faculty faculty = facultyRepository.findByUserEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty profile not found for: " + email));
            if (!assignment.getFaculty().getId().equals(faculty.getId())) {
                throw new SecurityException("You can only delete your own assignments");
            }
        }

        assignmentRepository.delete(assignment);
    }

    /**
     * Get assignment statistics (submission counts by status).
     * Faculty can only view stats for their own assignments; Admin can view any.
     */
    @Transactional(readOnly = true)
    public AssignmentStatisticsResponse getAssignmentStatistics(Long assignmentId, String email) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", "id", assignmentId));

        if (email != null && !email.isBlank()) {
            User user = getUserByEmail(email);
            if (user.getRole() == Role.FACULTY) {
                Faculty faculty = facultyRepository.findByUserEmail(email)
                        .orElseThrow(() -> new ResourceNotFoundException("Faculty profile not found for: " + email));
                if (!assignment.getFaculty().getId().equals(faculty.getId())) {
                    throw new SecurityException("You can only view statistics for your own assignments");
                }
            }
        }

        long totalEnrolled = enrollmentRepository.countByCourseId(assignment.getCourse().getId());
        long submitted = submissionRepository.countByAssignmentIdAndStatus(assignmentId, SubmissionStatus.SUBMITTED);
        long late = submissionRepository.countByAssignmentIdAndStatus(assignmentId, SubmissionStatus.LATE);
        long graded = submissionRepository.countByAssignmentIdAndStatus(assignmentId, SubmissionStatus.GRADED);
        long totalSubmissions = submitted + late + graded;
        long notSubmitted = totalEnrolled - totalSubmissions;

        AssignmentStatisticsResponse stats = new AssignmentStatisticsResponse();
        stats.setAssignmentId(assignmentId);
        stats.setAssignmentTitle(assignment.getTitle());
        stats.setTotalEnrolledStudents(totalEnrolled);
        stats.setSubmitted(submitted);
        stats.setNotSubmitted(Math.max(0, notSubmitted));
        stats.setLate(late);
        stats.setGraded(graded);
        return stats;
    }

    @Transactional(readOnly = true)
    public AssignmentStatisticsResponse getAssignmentStatistics(Long assignmentId) {
        return getAssignmentStatistics(assignmentId, null);
    }

    // ---- Helper Methods ----

    private AssignmentResponse mapToResponse(Assignment assignment, Long studentId) {
        AssignmentResponse response = new AssignmentResponse();
        response.setId(assignment.getId());
        response.setTitle(assignment.getTitle());
        response.setDescription(assignment.getDescription());
        response.setCourseId(assignment.getCourse().getId());
        response.setCourseCode(assignment.getCourse().getCourseCode());
        response.setCourseName(assignment.getCourse().getCourseName());
        response.setFacultyId(assignment.getFaculty().getId());
        response.setFacultyName(assignment.getFaculty().getUser().getFullName());
        response.setDueDate(assignment.getDueDate());
        response.setTotalMarks(assignment.getTotalMarks());
        response.setIsOverdue(LocalDateTime.now().isAfter(assignment.getDueDate()));
        response.setCreatedAt(assignment.getCreatedAt());

        // Submission count for faculty/admin
        long subCount = submissionRepository.countByAssignmentId(assignment.getId());
        response.setSubmissionCount(subCount);

        // Student-specific submission status
        if (studentId != null) {
            submissionRepository.findByAssignmentIdAndStudentId(assignment.getId(), studentId)
                    .ifPresentOrElse(
                            sub -> {
                                response.setSubmissionStatus(sub.getStatus().name());
                                response.setObtainedMarks(sub.getMarks());
                            },
                            () -> response.setSubmissionStatus(SubmissionStatus.NOT_SUBMITTED.name())
                    );
        }

        return response;
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }

    private Long getStudentIdIfStudent(String email) {
        return studentRepository.findByUserEmail(email)
                .map(Student::getId)
                .orElse(null);
    }
}
