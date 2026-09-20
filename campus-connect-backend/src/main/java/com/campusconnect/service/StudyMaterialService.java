package com.campusconnect.service;

import com.campusconnect.dto.request.StudyMaterialRequest;
import com.campusconnect.dto.response.StudyMaterialResponse;
import com.campusconnect.entity.*;
import com.campusconnect.enums.Role;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.repository.*;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

/**
 * StudyMaterialService — manages the study material lifecycle, authorization, and file operations.
 *
 * AUTHORIZATION RULES:
 * - ADMIN: Full CRUD across all courses and materials.
 * - FACULTY: Create, edit, and delete materials ONLY for their assigned courses.
 * - STUDENT: Read and download access ONLY for courses they are enrolled in.
 */
@Service
public class StudyMaterialService {

    private final StudyMaterialRepository studyMaterialRepository;
    private final CourseRepository courseRepository;
    private final FacultyRepository facultyRepository;
    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;

    public StudyMaterialService(StudyMaterialRepository studyMaterialRepository,
                                CourseRepository courseRepository,
                                FacultyRepository facultyRepository,
                                StudentRepository studentRepository,
                                EnrollmentRepository enrollmentRepository,
                                UserRepository userRepository,
                                FileStorageService fileStorageService) {
        this.studyMaterialRepository = studyMaterialRepository;
        this.courseRepository = courseRepository;
        this.facultyRepository = facultyRepository;
        this.studentRepository = studentRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.userRepository = userRepository;
        this.fileStorageService = fileStorageService;
    }

    /**
     * Create a new study material with an uploaded file.
     * Faculty can only upload for their assigned courses. Admin can upload for any course.
     */
    @Transactional
    public StudyMaterialResponse createStudyMaterial(String email, StudyMaterialRequest request, MultipartFile file) {
        User user = getUserByEmail(email);

        if (user.getRole() == Role.STUDENT) {
            throw new SecurityException("Students are not authorized to upload study materials");
        }

        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", request.getCourseId()));

        Faculty faculty;
        if (user.getRole() == Role.ADMIN) {
            faculty = course.getFaculty();
        } else {
            faculty = facultyRepository.findByUserEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty profile not found for: " + email));
            if (course.getFaculty() == null || !course.getFaculty().getId().equals(faculty.getId())) {
                throw new SecurityException("You are not assigned to this course: " + course.getCourseCode());
            }
        }

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("A file is required when creating study material");
        }

        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
        String storedFileName = fileStorageService.storeFile(file);
        String contentType = fileStorageService.determineContentType(originalFilename);

        StudyMaterial material = new StudyMaterial();
        material.setTitle(request.getTitle().trim());
        material.setDescription(request.getDescription() != null ? request.getDescription().trim() : "");
        material.setCourse(course);
        material.setFaculty(faculty);
        material.setFileName(originalFilename);
        material.setStoredFileName(storedFileName);
        material.setFileType(contentType);
        material.setFileSize(file.getSize());

        StudyMaterial saved = studyMaterialRepository.save(material);
        return mapToResponse(saved);
    }

    /**
     * Update study material metadata and optionally replace the uploaded file.
     */
    @Transactional
    public StudyMaterialResponse updateStudyMaterial(String email, Long id, StudyMaterialRequest request, MultipartFile file) {
        StudyMaterial material = studyMaterialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("StudyMaterial", "id", id));

        User user = getUserByEmail(email);
        if (user.getRole() == Role.STUDENT) {
            throw new SecurityException("Students are not authorized to modify study materials");
        }

        if (user.getRole() != Role.ADMIN) {
            Faculty faculty = facultyRepository.findByUserEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty profile not found for: " + email));
            Course currentCourse = material.getCourse();
            if (currentCourse.getFaculty() == null || !currentCourse.getFaculty().getId().equals(faculty.getId())) {
                throw new SecurityException("You can only update study materials for your own assigned courses");
            }
        }

        // Handle optional course change
        if (request.getCourseId() != null && !material.getCourse().getId().equals(request.getCourseId())) {
            Course newCourse = courseRepository.findById(request.getCourseId())
                    .orElseThrow(() -> new ResourceNotFoundException("Course", "id", request.getCourseId()));
            if (user.getRole() != Role.ADMIN) {
                Faculty faculty = facultyRepository.findByUserEmail(email).orElseThrow();
                if (newCourse.getFaculty() == null || !newCourse.getFaculty().getId().equals(faculty.getId())) {
                    throw new SecurityException("You are not assigned to the destination course: " + newCourse.getCourseCode());
                }
            }
            material.setCourse(newCourse);
            material.setFaculty(newCourse.getFaculty());
        }

        material.setTitle(request.getTitle().trim());
        if (request.getDescription() != null) {
            material.setDescription(request.getDescription().trim());
        }

        // Handle optional file replacement
        if (file != null && !file.isEmpty()) {
            String oldStoredFileName = material.getStoredFileName();
            String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
            String newStoredFileName = fileStorageService.storeFile(file);
            String contentType = fileStorageService.determineContentType(originalFilename);

            // Delete old file from storage
            fileStorageService.deleteFile(oldStoredFileName);

            material.setFileName(originalFilename);
            material.setStoredFileName(newStoredFileName);
            material.setFileType(contentType);
            material.setFileSize(file.getSize());
        }

        StudyMaterial updated = studyMaterialRepository.save(material);
        return mapToResponse(updated);
    }

    /**
     * Delete study material and its physical file on disk.
     */
    @Transactional
    public void deleteStudyMaterial(String email, Long id) {
        StudyMaterial material = studyMaterialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("StudyMaterial", "id", id));

        User user = getUserByEmail(email);
        if (user.getRole() == Role.STUDENT) {
            throw new SecurityException("Students are not authorized to delete study materials");
        }

        if (user.getRole() != Role.ADMIN) {
            Faculty faculty = facultyRepository.findByUserEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty profile not found for: " + email));
            Course course = material.getCourse();
            if (course.getFaculty() == null || !course.getFaculty().getId().equals(faculty.getId())) {
                throw new SecurityException("You can only delete study materials for your own assigned courses");
            }
        }

        // Delete physical file from disk
        fileStorageService.deleteFile(material.getStoredFileName());

        // Delete entity from database
        studyMaterialRepository.delete(material);
    }

    /**
     * Get single study material details by ID.
     */
    @Transactional(readOnly = true)
    public StudyMaterialResponse getStudyMaterialById(Long id, String email) {
        StudyMaterial material = studyMaterialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("StudyMaterial", "id", id));

        validateUserAccessToCourseMaterial(email, material.getCourse());

        return mapToResponse(material);
    }

    /**
     * Get all accessible study materials (role-aware: student, faculty, admin).
     */
    @Transactional(readOnly = true)
    public List<StudyMaterialResponse> getAllStudyMaterials(String email) {
        User user = getUserByEmail(email);

        if (user.getRole() == Role.STUDENT) {
            Student student = studentRepository.findByUserEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for: " + email));

            List<Long> enrolledCourseIds = enrollmentRepository.findByStudentId(student.getId()).stream()
                    .map(e -> e.getCourse().getId())
                    .collect(Collectors.toList());

            if (enrolledCourseIds.isEmpty()) {
                return List.of();
            }

            return studyMaterialRepository.findByCourseIdIn(enrolledCourseIds).stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        } else if (user.getRole() == Role.FACULTY) {
            Faculty faculty = facultyRepository.findByUserEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty profile not found for: " + email));

            List<Long> assignedCourseIds = courseRepository.findByFacultyId(faculty.getId()).stream()
                    .map(Course::getId)
                    .collect(Collectors.toList());

            if (assignedCourseIds.isEmpty()) {
                return List.of();
            }

            return studyMaterialRepository.findByCourseIdIn(assignedCourseIds).stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        } else {
            // ADMIN: view all study materials
            return studyMaterialRepository.findAll().stream()
                    .map(this::mapToResponse)
                    .collect(Collectors.toList());
        }
    }

    /**
     * Get study materials for a specific course.
     */
    @Transactional(readOnly = true)
    public List<StudyMaterialResponse> getStudyMaterialsByCourse(Long courseId, String email) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        validateUserAccessToCourseMaterial(email, course);

        return studyMaterialRepository.findByCourseId(courseId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Loads the file Resource for download or preview after verifying caller access.
     */
    @Transactional(readOnly = true)
    public Resource loadFileAsResource(Long id, String email) {
        StudyMaterial material = studyMaterialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("StudyMaterial", "id", id));

        validateUserAccessToCourseMaterial(email, material.getCourse());

        return fileStorageService.loadFileAsResource(material.getStoredFileName());
    }

    /**
     * Retrieves StudyMaterial entity for metadata extraction in Controller.
     */
    @Transactional(readOnly = true)
    public StudyMaterial getStudyMaterialEntity(Long id) {
        return studyMaterialRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("StudyMaterial", "id", id));
    }

    // ---- Helper Methods ----

    private void validateUserAccessToCourseMaterial(String email, Course course) {
        User user = getUserByEmail(email);
        if (user.getRole() == Role.ADMIN) {
            return;
        }

        if (user.getRole() == Role.STUDENT) {
            Student student = studentRepository.findByUserEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for: " + email));
            boolean isEnrolled = enrollmentRepository.existsByStudentIdAndCourseId(student.getId(), course.getId());
            if (!isEnrolled) {
                throw new SecurityException("You are not enrolled in course: " + course.getCourseCode());
            }
        } else if (user.getRole() == Role.FACULTY) {
            Faculty faculty = facultyRepository.findByUserEmail(email)
                    .orElseThrow(() -> new ResourceNotFoundException("Faculty profile not found for: " + email));
            // Faculty can view materials for any assigned course
            if (course.getFaculty() == null || !course.getFaculty().getId().equals(faculty.getId())) {
                throw new SecurityException("You are not assigned to course: " + course.getCourseCode());
            }
        }
    }

    public StudyMaterialResponse mapToResponse(StudyMaterial material) {
        StudyMaterialResponse response = new StudyMaterialResponse();
        response.setId(material.getId());
        response.setTitle(material.getTitle());
        response.setDescription(material.getDescription());
        response.setCourseId(material.getCourse().getId());
        response.setCourseCode(material.getCourse().getCourseCode());
        response.setCourseName(material.getCourse().getCourseName());

        if (material.getFaculty() != null) {
            response.setFacultyId(material.getFaculty().getId());
            response.setFacultyName(material.getFaculty().getUser().getFullName());
        } else if (material.getCourse().getFaculty() != null) {
            response.setFacultyId(material.getCourse().getFaculty().getId());
            response.setFacultyName(material.getCourse().getFaculty().getUser().getFullName());
        } else {
            response.setFacultyName("System Admin");
        }

        response.setFileName(material.getFileName());
        response.setFileType(material.getFileType());
        response.setFileSize(material.getFileSize());
        response.setFileDownloadUri("/api/study-materials/" + material.getId() + "/download");
        response.setFileViewUri("/api/study-materials/" + material.getId() + "/view");
        response.setCreatedAt(material.getCreatedAt());
        response.setUpdatedAt(material.getUpdatedAt());

        return response;
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + email));
    }
}
