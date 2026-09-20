package com.campusconnect.service;

import com.campusconnect.dto.request.AssignmentSubmissionRequest;
import com.campusconnect.dto.request.GradeSubmissionRequest;
import com.campusconnect.dto.response.AssignmentSubmissionResponse;
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
 * SubmissionService — manages assignment submission lifecycle, resubmission, and grading.
 * Authorization is enforced via JWT identity.
 */
@Service
public class SubmissionService {

    private final AssignmentSubmissionRepository submissionRepository;
    private final AssignmentRepository assignmentRepository;
    private final StudentRepository studentRepository;
    private final FacultyRepository facultyRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;

    public SubmissionService(AssignmentSubmissionRepository submissionRepository,
                             AssignmentRepository assignmentRepository,
                             StudentRepository studentRepository,
                             FacultyRepository facultyRepository,
                             EnrollmentRepository enrollmentRepository,
                             UserRepository userRepository) {
        this.submissionRepository = submissionRepository;
        this.assignmentRepository = assignmentRepository;
        this.studentRepository = studentRepository;
        this.facultyRepository = facultyRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
    }

    /**
     * Submit (or resubmit) an assignment.
     * - Validates student is enrolled in the course.
     * - If a submission already exists and is not GRADED, updates it.
     * - Marks as LATE if past due date.
     */
    @Transactional
    public AssignmentSubmissionResponse submitAssignment(String email, Long assignmentId,
                                                         AssignmentSubmissionRequest request) {
        Student student = studentRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for: " + email));

        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", "id", assignmentId));

        // Verify student is enrolled in the assignment's course
        if (!enrollmentRepository.existsByStudentIdAndCourseId(student.getId(), assignment.getCourse().getId())) {
            throw new SecurityException("You are not enrolled in course: " + assignment.getCourse().getCourseCode());
        }

        // Check if submission already exists
        AssignmentSubmission submission = submissionRepository
                .findByAssignmentIdAndStudentId(assignmentId, student.getId())
                .orElse(null);

        if (submission != null) {
            // Resubmission — only allowed if not graded
            if (submission.getStatus() == SubmissionStatus.GRADED) {
                throw new IllegalStateException("Cannot resubmit — this assignment has already been graded");
            }
            submission.setSubmissionText(request.getSubmissionText());
            // Re-evaluate deadline
            submission.setStatus(LocalDateTime.now().isAfter(assignment.getDueDate())
                    ? SubmissionStatus.LATE
                    : SubmissionStatus.SUBMITTED);
        } else {
            // New submission
            submission = new AssignmentSubmission();
            submission.setAssignment(assignment);
            submission.setStudent(student);
            submission.setSubmissionText(request.getSubmissionText());
            submission.setStatus(LocalDateTime.now().isAfter(assignment.getDueDate())
                    ? SubmissionStatus.LATE
                    : SubmissionStatus.SUBMITTED);
        }

        AssignmentSubmission saved = submissionRepository.save(submission);
        return mapToResponse(saved);
    }

    /**
     * Update an existing submission (Student only, before grading).
     */
    @Transactional
    public AssignmentSubmissionResponse updateSubmission(String email, Long submissionId,
                                                         AssignmentSubmissionRequest request) {
        Student student = studentRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for: " + email));

        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", "id", submissionId));

        // Verify ownership
        if (!submission.getStudent().getId().equals(student.getId())) {
            throw new SecurityException("You can only update your own submissions");
        }

        if (submission.getStatus() == SubmissionStatus.GRADED) {
            throw new IllegalStateException("Cannot update — this submission has already been graded");
        }

        submission.setSubmissionText(request.getSubmissionText());
        submission.setStatus(LocalDateTime.now().isAfter(submission.getAssignment().getDueDate())
                ? SubmissionStatus.LATE
                : SubmissionStatus.SUBMITTED);

        AssignmentSubmission updated = submissionRepository.save(submission);
        return mapToResponse(updated);
    }

    /**
     * Get all submissions for the logged-in student.
     */
    @Transactional(readOnly = true)
    public List<AssignmentSubmissionResponse> getMySubmissions(String email) {
        Student student = studentRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for: " + email));
        return submissionRepository.findByStudentId(student.getId()).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get the logged-in student's submission for a specific assignment.
     */
    @Transactional(readOnly = true)
    public AssignmentSubmissionResponse getMySubmissionForAssignment(String email, Long assignmentId) {
        Student student = studentRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for: " + email));

        AssignmentSubmission submission = submissionRepository
                .findByAssignmentIdAndStudentId(assignmentId, student.getId())
                .orElseThrow(() -> new ResourceNotFoundException("No submission found for this assignment"));

        return mapToResponse(submission);
    }

    /**
     * Get all submissions for an assignment (Faculty/Admin).
     * Faculty can only view submissions for their own assignments.
     */
    @Transactional(readOnly = true)
    public List<AssignmentSubmissionResponse> getSubmissionsForAssignment(String email, Long assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Assignment", "id", assignmentId));

        User user = getUserByEmail(email);
        if (user.getRole() == Role.FACULTY) {
            Faculty faculty = facultyRepository.findByUserEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty profile not found for: " + email));
            if (!assignment.getFaculty().getId().equals(faculty.getId())) {
                throw new SecurityException("You can only view submissions for your own assignments");
            }
        }

        return submissionRepository.findByAssignmentId(assignmentId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get a single submission by ID (with authorization).
     */
    @Transactional(readOnly = true)
    public AssignmentSubmissionResponse getSubmissionById(String email, Long submissionId) {
        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", "id", submissionId));

        User user = getUserByEmail(email);
        if (user.getRole() == Role.STUDENT) {
            Student student = studentRepository.findByUserEmail(email).orElse(null);
            if (student == null || !submission.getStudent().getId().equals(student.getId())) {
                throw new SecurityException("You can only view your own submissions");
            }
        } else if (user.getRole() == Role.FACULTY) {
            Faculty faculty = facultyRepository.findByUserEmail(email).orElse(null);
            if (faculty == null || !submission.getAssignment().getFaculty().getId().equals(faculty.getId())) {
                throw new SecurityException("You can only view submissions for your own assignments");
            }
        }
        // Admin can view all

        return mapToResponse(submission);
    }

    /**
     * Grade a submission (Faculty/Admin).
     * Validates marks <= totalMarks. Sets status to GRADED.
     */
    @Transactional
    public AssignmentSubmissionResponse gradeSubmission(String email, Long submissionId,
                                                        GradeSubmissionRequest request) {
        AssignmentSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission", "id", submissionId));

        User user = getUserByEmail(email);
        if (user.getRole() == Role.FACULTY) {
            Faculty faculty = facultyRepository.findByUserEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty profile not found for: " + email));
            if (!submission.getAssignment().getFaculty().getId().equals(faculty.getId())) {
                throw new SecurityException("You can only grade submissions for your own assignments");
            }
        }
        // Admin can grade anything

        // Validate marks
        if (request.getMarks() > submission.getAssignment().getTotalMarks()) {
            throw new IllegalArgumentException(
                    "Marks (" + request.getMarks() + ") cannot exceed total marks (" +
                    submission.getAssignment().getTotalMarks() + ")"
            );
        }

        submission.setMarks(request.getMarks());
        submission.setFeedback(request.getFeedback());
        submission.setStatus(SubmissionStatus.GRADED);

        AssignmentSubmission graded = submissionRepository.save(submission);
        return mapToResponse(graded);
    }

    // ---- Helper Methods ----

    private AssignmentSubmissionResponse mapToResponse(AssignmentSubmission submission) {
        AssignmentSubmissionResponse response = new AssignmentSubmissionResponse();
        response.setId(submission.getId());
        response.setAssignmentId(submission.getAssignment().getId());
        response.setAssignmentTitle(submission.getAssignment().getTitle());
        response.setTotalMarks(submission.getAssignment().getTotalMarks());
        response.setStudentId(submission.getStudent().getId());
        response.setStudentName(submission.getStudent().getUser().getFullName());
        response.setRollNumber(submission.getStudent().getRollNumber());
        response.setSubmissionText(submission.getSubmissionText());
        response.setSubmittedAt(submission.getSubmittedAt());
        response.setUpdatedAt(submission.getUpdatedAt());
        response.setMarks(submission.getMarks());
        response.setFeedback(submission.getFeedback());
        response.setStatus(submission.getStatus().name());
        response.setCourseCode(submission.getAssignment().getCourse().getCourseCode());
        response.setCourseName(submission.getAssignment().getCourse().getCourseName());
        return response;
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }
}
