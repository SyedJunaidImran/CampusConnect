package com.campusconnect.service;

import com.campusconnect.dto.request.StudentProfileUpdateRequest;
import com.campusconnect.dto.response.StudentProfileResponse;
import com.campusconnect.entity.Student;
import com.campusconnect.entity.User;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.repository.EnrollmentRepository;
import com.campusconnect.repository.StudentRepository;
import com.campusconnect.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * StudentService — manages student profile information, updates, and student rosters.
 */
@Service
public class StudentService {

    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final EnrollmentRepository enrollmentRepository;

    public StudentService(StudentRepository studentRepository,
                          UserRepository userRepository,
                          EnrollmentRepository enrollmentRepository) {
        this.studentRepository = studentRepository;
        this.userRepository = userRepository;
        this.enrollmentRepository = enrollmentRepository;
    }

    /**
     * Get the logged-in student's complete profile.
     */
    @Transactional(readOnly = true)
    public StudentProfileResponse getProfileByEmail(String email) {
        Student student = studentRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for email: " + email));

        return mapToResponse(student);
    }

    /**
     * Update the logged-in student's profile.
     */
    @Transactional
    public StudentProfileResponse updateProfile(String email, StudentProfileUpdateRequest request) {
        Student student = studentRepository.findByUserEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for email: " + email));

        User user = student.getUser();
        user.setFullName(request.getFullName().trim());
        userRepository.save(user);

        if (request.getPhone() != null) {
            student.setPhone(request.getPhone().trim());
        }
        if (request.getSemester() != null) {
            student.setSemester(request.getSemester());
        }

        Student updated = studentRepository.save(student);
        return mapToResponse(updated);
    }

    /**
     * Get all students (Admin only).
     */
    @Transactional(readOnly = true)
    public List<StudentProfileResponse> getAllStudents() {
        return studentRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get student by ID (Admin only).
     */
    @Transactional(readOnly = true)
    public StudentProfileResponse getStudentById(Long id) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", id));
        return mapToResponse(student);
    }

    /**
     * Helper to map Student entity to StudentProfileResponse DTO.
     */
    private StudentProfileResponse mapToResponse(Student student) {
        StudentProfileResponse res = new StudentProfileResponse();
        res.setId(student.getId());
        res.setUserId(student.getUser().getId());
        res.setEmail(student.getUser().getEmail());
        res.setFullName(student.getUser().getFullName());
        res.setRole(student.getUser().getRole().name());

        res.setRollNumber(student.getRollNumber());
        res.setDepartment(student.getDepartment());
        res.setSemester(student.getSemester());
        res.setYearOfAdmission(student.getYearOfAdmission());
        res.setPhone(student.getPhone());
        res.setMemberSince(student.getUser().getCreatedAt());

        long count = enrollmentRepository.countByStudentId(student.getId());
        res.setEnrolledCoursesCount(count);

        return res;
    }
}
