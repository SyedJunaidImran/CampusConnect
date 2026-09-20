package com.campusconnect.service;

import com.campusconnect.dto.response.FacultyResponse;
import com.campusconnect.entity.Faculty;
import com.campusconnect.repository.CourseRepository;
import com.campusconnect.repository.FacultyRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * FacultyService — manages faculty member queries and directory.
 */
@Service
public class FacultyService {

    private final FacultyRepository facultyRepository;
    private final CourseRepository courseRepository;

    public FacultyService(FacultyRepository facultyRepository,
                          CourseRepository courseRepository) {
        this.facultyRepository = facultyRepository;
        this.courseRepository = courseRepository;
    }

    /**
     * Get all faculty members (for Admin course assignment dropdown and faculty lists).
     */
    @Transactional(readOnly = true)
    public List<FacultyResponse> getAllFaculty() {
        return facultyRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private FacultyResponse mapToResponse(Faculty faculty) {
        FacultyResponse res = new FacultyResponse();
        res.setId(faculty.getId());
        res.setUserId(faculty.getUser().getId());
        res.setEmail(faculty.getUser().getEmail());
        res.setFullName(faculty.getUser().getFullName());
        res.setEmployeeId(faculty.getEmployeeId());
        res.setDepartment(faculty.getDepartment());
        res.setDesignation(faculty.getDesignation());
        res.setPhone(faculty.getPhone());

        long courseCount = courseRepository.findByFacultyId(faculty.getId()).size();
        res.setAssignedCoursesCount(courseCount);

        return res;
    }
}
