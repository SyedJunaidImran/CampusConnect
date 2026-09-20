package com.campusconnect.service;

import com.campusconnect.dto.response.analytics.*;
import com.campusconnect.entity.*;
import com.campusconnect.enums.AttendanceStatus;
import com.campusconnect.enums.Role;
import com.campusconnect.enums.SubmissionStatus;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.repository.*;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * AnalyticsService — computes academic and institutional analytics by querying
 * existing database relationships with efficient aggregations and strict server-side authorization.
 */
@Service
@Transactional(readOnly = true)
public class AnalyticsService {

    private final StudentRepository studentRepository;
    private final FacultyRepository facultyRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AttendanceRepository attendanceRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final StudyMaterialRepository studyMaterialRepository;
    private final AnnouncementRepository announcementRepository;
    private final MessageRepository messageRepository;

    public AnalyticsService(StudentRepository studentRepository,
                            FacultyRepository facultyRepository,
                            CourseRepository courseRepository,
                            EnrollmentRepository enrollmentRepository,
                            AttendanceRepository attendanceRepository,
                            AssignmentRepository assignmentRepository,
                            AssignmentSubmissionRepository assignmentSubmissionRepository,
                            StudyMaterialRepository studyMaterialRepository,
                            AnnouncementRepository announcementRepository,
                            MessageRepository messageRepository) {
        this.studentRepository = studentRepository;
        this.facultyRepository = facultyRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.attendanceRepository = attendanceRepository;
        this.assignmentRepository = assignmentRepository;
        this.assignmentSubmissionRepository = assignmentSubmissionRepository;
        this.studyMaterialRepository = studyMaterialRepository;
        this.announcementRepository = announcementRepository;
        this.messageRepository = messageRepository;
    }

    /**
     * Compute system-wide analytics for ADMIN.
     */
    public AdminAnalyticsResponse getAdminAnalytics() {
        long totalStudents = studentRepository.count();
        long totalFaculty = facultyRepository.count();
        long totalCourses = courseRepository.count();
        long totalEnrollments = enrollmentRepository.count();
        long totalAssignments = assignmentRepository.count();
        long totalStudyMaterials = studyMaterialRepository.count();
        long totalAnnouncements = announcementRepository.count();
        long totalMessages = messageRepository.count();

        // Attendance aggregation
        long totalPresent = attendanceRepository.countByStatus(AttendanceStatus.PRESENT);
        long totalAbsent = attendanceRepository.countByStatus(AttendanceStatus.ABSENT);
        long totalAttendanceRecords = totalPresent + totalAbsent;
        double overallAttendancePercentage = totalAttendanceRecords > 0
                ? Math.round(((double) totalPresent / totalAttendanceRecords) * 1000.0) / 10.0
                : 0.0;

        // Assignment Submissions aggregation
        long totalSubmissions = assignmentSubmissionRepository.count();
        long gradedCount = assignmentSubmissionRepository.countByStatus(SubmissionStatus.GRADED);
        long submittedCount = assignmentSubmissionRepository.countByStatus(SubmissionStatus.SUBMITTED);
        long lateCount = assignmentSubmissionRepository.countByStatus(SubmissionStatus.LATE);

        // Expected submissions: sum of (enrolled students * assignments for that course)
        List<Course> allCourses = courseRepository.findAll();
        long expectedSubmissions = 0;
        List<CourseEnrollmentStatDto> courseEnrollments = new ArrayList<>();

        for (Course course : allCourses) {
            long enrolledCount = enrollmentRepository.countByCourseId(course.getId());
            long courseAssignments = assignmentRepository.countByCourseId(course.getId());
            expectedSubmissions += (enrolledCount * courseAssignments);

            // Course attendance
            long coursePresent = attendanceRepository.countByCourseIdAndStatus(course.getId(), AttendanceStatus.PRESENT);
            long courseTotal = attendanceRepository.countByCourseId(course.getId());
            double courseAttPct = courseTotal > 0
                    ? Math.round(((double) coursePresent / courseTotal) * 1000.0) / 10.0
                    : 0.0;

            String facultyName = (course.getFaculty() != null && course.getFaculty().getUser() != null)
                    ? course.getFaculty().getUser().getFullName()
                    : "Unassigned";

            courseEnrollments.add(new CourseEnrollmentStatDto(
                    course.getId(),
                    course.getCourseCode(),
                    course.getCourseName(),
                    course.getDepartment(),
                    course.getSemester(),
                    enrolledCount,
                    facultyName,
                    courseAttPct,
                    courseAssignments
            ));
        }

        double submissionRate = expectedSubmissions > 0
                ? Math.round(((double) totalSubmissions / expectedSubmissions) * 1000.0) / 10.0
                : 0.0;
        double completionRate = totalSubmissions > 0
                ? Math.round(((double) gradedCount / totalSubmissions) * 1000.0) / 10.0
                : 0.0;

        AssignmentSubmissionStatsDto assignmentStats = new AssignmentSubmissionStatsDto(
                totalAssignments,
                totalSubmissions,
                gradedCount,
                submittedCount,
                lateCount,
                submissionRate,
                completionRate
        );

        // Department breakdown
        Map<String, List<Course>> coursesByDept = allCourses.stream()
                .collect(Collectors.groupingBy(c -> c.getDepartment() != null ? c.getDepartment() : "General"));
        List<Student> allStudents = studentRepository.findAll();
        Map<String, Long> studentsByDept = allStudents.stream()
                .collect(Collectors.groupingBy(s -> s.getDepartment() != null ? s.getDepartment() : "General", Collectors.counting()));
        List<Faculty> allFacultyList = facultyRepository.findAll();
        Map<String, Long> facultyByDept = allFacultyList.stream()
                .collect(Collectors.groupingBy(f -> f.getDepartment() != null ? f.getDepartment() : "General", Collectors.counting()));

        Set<String> allDeptNames = new HashSet<>();
        allDeptNames.addAll(coursesByDept.keySet());
        allDeptNames.addAll(studentsByDept.keySet());
        allDeptNames.addAll(facultyByDept.keySet());

        List<DepartmentStatDto> departmentStats = new ArrayList<>();
        for (String dept : allDeptNames) {
            departmentStats.add(new DepartmentStatDto(
                    dept,
                    studentsByDept.getOrDefault(dept, 0L),
                    coursesByDept.containsKey(dept) ? coursesByDept.get(dept).size() : 0L,
                    facultyByDept.getOrDefault(dept, 0L)
            ));
        }

        // Recent activities feed
        List<RecentActivityDto> recentActivities = new ArrayList<>();
        List<Announcement> recentAnnouncements = announcementRepository.findAllByOrderByCreatedAtDesc();
        recentAnnouncements.stream().limit(4).forEach(a ->
                recentActivities.add(new RecentActivityDto(
                        "ANNOUNCEMENT",
                        a.getTitle(),
                        "Target: " + a.getTargetAudience(),
                        a.getCreatedAt()
                ))
        );

        List<Assignment> recentAssignments = assignmentRepository.findAll();
        recentAssignments.stream()
                .sorted(Comparator.comparing(Assignment::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(4)
                .forEach(a ->
                        recentActivities.add(new RecentActivityDto(
                                "ASSIGNMENT",
                                a.getTitle(),
                                "Course: " + a.getCourse().getCourseCode() + " • Due: " + a.getDueDate(),
                                a.getCreatedAt()
                        ))
                );

        recentActivities.sort(Comparator.comparing(RecentActivityDto::getTimestamp, Comparator.nullsLast(Comparator.reverseOrder())));

        return new AdminAnalyticsResponse(
                totalStudents,
                totalFaculty,
                totalCourses,
                totalEnrollments,
                totalAssignments,
                totalStudyMaterials,
                totalAnnouncements,
                totalMessages,
                overallAttendancePercentage,
                totalAttendanceRecords,
                totalPresent,
                totalAbsent,
                assignmentStats,
                courseEnrollments,
                departmentStats,
                recentActivities
        );
    }

    /**
     * Compute analytics across all courses taught by a faculty member.
     */
    public FacultyAnalyticsResponse getFacultyAnalytics(String userEmail) {
        Faculty faculty = facultyRepository.findByUserEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Faculty profile not found for user: " + userEmail));

        List<Course> assignedCourses = courseRepository.findByFacultyId(faculty.getId());
        long assignedCoursesCount = assignedCourses.size();

        // Find distinct enrolled students across all assigned courses
        Set<Long> distinctStudentIds = new HashSet<>();
        List<Long> courseIds = new ArrayList<>();
        List<CourseEnrollmentStatDto> courseSummaries = new ArrayList<>();
        long totalStudentsBelowThreshold = 0;

        for (Course course : assignedCourses) {
            courseIds.add(course.getId());
            List<Enrollment> enrollments = enrollmentRepository.findByCourseId(course.getId());
            long enrolledCount = enrollments.size();
            enrollments.forEach(e -> distinctStudentIds.add(e.getStudent().getId()));

            long coursePresent = attendanceRepository.countByCourseIdAndStatus(course.getId(), AttendanceStatus.PRESENT);
            long courseTotal = attendanceRepository.countByCourseId(course.getId());
            double courseAttPct = courseTotal > 0
                    ? Math.round(((double) coursePresent / courseTotal) * 1000.0) / 10.0
                    : 0.0;

            long courseAssignments = assignmentRepository.countByCourseId(course.getId());

            courseSummaries.add(new CourseEnrollmentStatDto(
                    course.getId(),
                    course.getCourseCode(),
                    course.getCourseName(),
                    course.getDepartment(),
                    course.getSemester(),
                    enrolledCount,
                    faculty.getUser().getFullName(),
                    courseAttPct,
                    courseAssignments
            ));

            // Check how many students are below 75% in this course
            for (Enrollment e : enrollments) {
                long sTotal = attendanceRepository.countByStudentIdAndCourseId(e.getStudent().getId(), course.getId());
                long sPresent = attendanceRepository.countByStudentIdAndCourseIdAndStatus(e.getStudent().getId(), course.getId(), AttendanceStatus.PRESENT);
                double sPct = sTotal > 0 ? ((double) sPresent / sTotal) * 100.0 : 0.0;
                if (sTotal > 0 && sPct < 75.0) {
                    totalStudentsBelowThreshold++;
                }
            }
        }

        long totalDistinctStudents = distinctStudentIds.size();
        long totalAssignments = assignmentRepository.countByFacultyId(faculty.getId());
        long totalSubmissions = assignmentSubmissionRepository.countByAssignmentFacultyId(faculty.getId());
        long pendingGrading = assignmentSubmissionRepository.countByAssignmentFacultyIdAndStatus(faculty.getId(), SubmissionStatus.SUBMITTED);

        // Overall attendance percentage for faculty's courses
        double overallAttendance = 0.0;
        if (!courseIds.isEmpty()) {
            long totalPres = attendanceRepository.countByCourseIdInAndStatus(courseIds, AttendanceStatus.PRESENT);
            long totalRec = attendanceRepository.countByCourseIdIn(courseIds);
            overallAttendance = totalRec > 0
                    ? Math.round(((double) totalPres / totalRec) * 1000.0) / 10.0
                    : 0.0;
        }

        return new FacultyAnalyticsResponse(
                faculty.getId(),
                faculty.getUser().getFullName(),
                faculty.getDepartment(),
                faculty.getEmployeeId(),
                assignedCoursesCount,
                totalDistinctStudents,
                totalAssignments,
                totalSubmissions,
                pendingGrading,
                overallAttendance,
                totalStudentsBelowThreshold,
                courseSummaries,
                null
        );
    }

    /**
     * Compute detailed analytics for a single course taught by a faculty member.
     * Enforces ownership: only assigned faculty (or Admin) can view.
     */
    public CourseDetailAnalyticsResponse getFacultyCourseAnalytics(String userEmail, Role userRole, Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new ResourceNotFoundException("Course", "id", courseId));

        if (userRole == Role.FACULTY) {
            if (course.getFaculty() == null || course.getFaculty().getUser() == null ||
                    !course.getFaculty().getUser().getEmail().equals(userEmail)) {
                throw new AccessDeniedException("You are not assigned to instruct course: " + course.getCourseCode());
            }
        }

        List<Enrollment> enrollments = enrollmentRepository.findByCourseId(courseId);
        long enrolledCount = enrollments.size();

        long totalPresentMarks = attendanceRepository.countByCourseIdAndStatus(courseId, AttendanceStatus.PRESENT);
        long totalAbsentMarks = attendanceRepository.countByCourseIdAndStatus(courseId, AttendanceStatus.ABSENT);
        long totalAttendanceMarks = totalPresentMarks + totalAbsentMarks;
        long totalClassesHeld = attendanceRepository.findDistinctAttendanceDatesByCourseId(courseId).size();

        double averageAttendance = totalAttendanceMarks > 0
                ? Math.round(((double) totalPresentMarks / totalAttendanceMarks) * 1000.0) / 10.0
                : 0.0;

        List<StudentAttendanceShortageDto> belowThresholdList = new ArrayList<>();
        List<StudentAttendanceShortageDto> fullReportList = new ArrayList<>();

        for (Enrollment enrollment : enrollments) {
            Student s = enrollment.getStudent();
            long sTotal = attendanceRepository.countByStudentIdAndCourseId(s.getId(), courseId);
            long sPresent = attendanceRepository.countByStudentIdAndCourseIdAndStatus(s.getId(), courseId, AttendanceStatus.PRESENT);
            long sMissed = sTotal - sPresent;
            double sPct = sTotal > 0
                    ? Math.round(((double) sPresent / sTotal) * 1000.0) / 10.0
                    : 0.0;
            boolean isBelow = sTotal > 0 && sPct < 75.0;

            StudentAttendanceShortageDto studentDto = new StudentAttendanceShortageDto(
                    s.getId(),
                    s.getUser().getFullName(),
                    s.getRollNumber(),
                    s.getDepartment(),
                    sTotal,
                    sPresent,
                    sMissed,
                    sPct,
                    isBelow
            );

            fullReportList.add(studentDto);
            if (isBelow) {
                belowThresholdList.add(studentDto);
            }
        }

        // Assignment stats
        List<Assignment> courseAssignments = assignmentRepository.findByCourseId(courseId);
        long totalAssignments = courseAssignments.size();
        long expectedSubmissions = totalAssignments * enrolledCount;
        long actualSubmissions = assignmentSubmissionRepository.countByAssignmentCourseId(courseId);
        double submissionRate = expectedSubmissions > 0
                ? Math.round(((double) actualSubmissions / expectedSubmissions) * 1000.0) / 10.0
                : 0.0;

        long gradedCount = assignmentSubmissionRepository.countByAssignmentCourseIdAndStatus(courseId, SubmissionStatus.GRADED);
        long pendingGradingCount = assignmentSubmissionRepository.countByAssignmentCourseIdAndStatus(courseId, SubmissionStatus.SUBMITTED);
        long lateCount = assignmentSubmissionRepository.countByAssignmentCourseIdAndStatus(courseId, SubmissionStatus.LATE);

        List<AssignmentSubmission> allCourseSubmissions = assignmentSubmissionRepository.findByAssignmentCourseId(courseId);
        Double averageMarks = null;
        List<AssignmentSubmission> gradedList = allCourseSubmissions.stream()
                .filter(sub -> sub.getMarks() != null)
                .collect(Collectors.toList());
        if (!gradedList.isEmpty()) {
            double sum = gradedList.stream().mapToInt(AssignmentSubmission::getMarks).sum();
            averageMarks = Math.round((sum / gradedList.size()) * 10.0) / 10.0;
        }

        CourseAssignmentStatsDto assignmentStats = new CourseAssignmentStatsDto(
                totalAssignments,
                expectedSubmissions,
                actualSubmissions,
                submissionRate,
                gradedCount,
                pendingGradingCount,
                lateCount,
                averageMarks
        );

        long studyMaterialsCount = studyMaterialRepository.countByCourseId(courseId);
        String facultyName = (course.getFaculty() != null && course.getFaculty().getUser() != null)
                ? course.getFaculty().getUser().getFullName()
                : "Unassigned";

        return new CourseDetailAnalyticsResponse(
                course.getId(),
                course.getCourseCode(),
                course.getCourseName(),
                course.getDepartment(),
                course.getSemester(),
                course.getCredits(),
                facultyName,
                enrolledCount,
                totalClassesHeld,
                totalAttendanceMarks,
                totalPresentMarks,
                totalAbsentMarks,
                averageAttendance,
                belowThresholdList,
                fullReportList,
                assignmentStats,
                studyMaterialsCount
        );
    }

    /**
     * Compute comprehensive personal analytics for the authenticated student.
     */
    public StudentAnalyticsResponse getStudentAnalytics(String userEmail) {
        Student student = studentRepository.findByUserEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Student profile not found for user: " + userEmail));

        List<Enrollment> enrollments = enrollmentRepository.findByStudentId(student.getId());
        long enrolledCoursesCount = enrollments.size();

        List<StudentCourseAttendanceDto> courseAttendanceList = new ArrayList<>();
        long totalClassesAllCourses = 0;
        long totalAttendedAllCourses = 0;
        long shortageCoursesCount = 0;
        List<Long> enrolledCourseIds = new ArrayList<>();

        for (Enrollment enrollment : enrollments) {
            Course course = enrollment.getCourse();
            enrolledCourseIds.add(course.getId());

            long totalClasses = attendanceRepository.countByStudentIdAndCourseId(student.getId(), course.getId());
            long attendedClasses = attendanceRepository.countByStudentIdAndCourseIdAndStatus(student.getId(), course.getId(), AttendanceStatus.PRESENT);
            long missedClasses = totalClasses - attendedClasses;

            double percentage = totalClasses > 0
                    ? Math.round(((double) attendedClasses / totalClasses) * 1000.0) / 10.0
                    : 0.0;

            boolean isBelowThreshold = totalClasses > 0 && percentage < 75.0;
            if (isBelowThreshold) {
                shortageCoursesCount++;
            }

            totalClassesAllCourses += totalClasses;
            totalAttendedAllCourses += attendedClasses;

            String facultyName = (course.getFaculty() != null && course.getFaculty().getUser() != null)
                    ? course.getFaculty().getUser().getFullName()
                    : "TBD";

            courseAttendanceList.add(new StudentCourseAttendanceDto(
                    course.getId(),
                    course.getCourseCode(),
                    course.getCourseName(),
                    facultyName,
                    totalClasses,
                    attendedClasses,
                    missedClasses,
                    percentage,
                    isBelowThreshold
            ));
        }

        long totalMissedAllCourses = totalClassesAllCourses - totalAttendedAllCourses;
        double overallAttendancePercentage = totalClassesAllCourses > 0
                ? Math.round(((double) totalAttendedAllCourses / totalClassesAllCourses) * 1000.0) / 10.0
                : 0.0;

        boolean hasAttendanceShortage = shortageCoursesCount > 0 || (totalClassesAllCourses > 0 && overallAttendancePercentage < 75.0);

        // Assignment analytics
        List<StudentAssignmentSummaryDto> studentAssignments = new ArrayList<>();
        long totalAssignments = 0;
        long submittedCount = 0;
        long gradedCount = 0;
        long pendingCount = 0;
        long lateCount = 0;
        double totalPercentageMarks = 0.0;

        if (!enrolledCourseIds.isEmpty()) {
            List<Assignment> availableAssignments = assignmentRepository.findByCourseIdIn(enrolledCourseIds);
            totalAssignments = availableAssignments.size();
            LocalDateTime now = LocalDateTime.now();

            for (Assignment assignment : availableAssignments) {
                Optional<AssignmentSubmission> subOpt = assignmentSubmissionRepository
                        .findByAssignmentIdAndStudentId(assignment.getId(), student.getId());

                String status = "NOT_SUBMITTED";
                Integer marksObtained = null;
                LocalDateTime submittedAt = null;
                boolean isPastDue = assignment.getDueDate().isBefore(now);

                if (subOpt.isPresent()) {
                    AssignmentSubmission sub = subOpt.get();
                    status = sub.getStatus().name();
                    marksObtained = sub.getMarks();
                    submittedAt = sub.getSubmittedAt();

                    if (sub.getStatus() == SubmissionStatus.GRADED) {
                        gradedCount++;
                        submittedCount++;
                        if (marksObtained != null && assignment.getTotalMarks() > 0) {
                            totalPercentageMarks += ((double) marksObtained / assignment.getTotalMarks()) * 100.0;
                        }
                    } else if (sub.getStatus() == SubmissionStatus.LATE) {
                        lateCount++;
                        submittedCount++;
                    } else if (sub.getStatus() == SubmissionStatus.SUBMITTED) {
                        submittedCount++;
                    }
                } else {
                    pendingCount++;
                    if (isPastDue) {
                        status = "OVERDUE";
                    }
                }

                studentAssignments.add(new StudentAssignmentSummaryDto(
                        assignment.getId(),
                        assignment.getTitle(),
                        assignment.getCourse().getCourseCode(),
                        assignment.getCourse().getCourseName(),
                        assignment.getDueDate(),
                        assignment.getTotalMarks(),
                        marksObtained,
                        status,
                        submittedAt,
                        isPastDue
                ));
            }
        }

        double assignmentCompletionRate = totalAssignments > 0
                ? Math.round(((double) submittedCount / totalAssignments) * 1000.0) / 10.0
                : 0.0;

        Double averageGradePercentage = gradedCount > 0
                ? Math.round((totalPercentageMarks / gradedCount) * 10.0) / 10.0
                : null;

        // Study materials & announcements count
        long studyMaterialsCount = enrolledCourseIds.isEmpty() ? 0 : studyMaterialRepository.countByCourseIdIn(enrolledCourseIds);
        long announcementsCount = enrolledCourseIds.isEmpty()
                ? announcementRepository.findForStudentGeneral().size()
                : announcementRepository.findForStudentWithCourses(enrolledCourseIds).size();

        return new StudentAnalyticsResponse(
                student.getId(),
                student.getUser().getFullName(),
                student.getRollNumber(),
                student.getDepartment(),
                student.getSemester(),
                enrolledCoursesCount,
                overallAttendancePercentage,
                totalClassesAllCourses,
                totalAttendedAllCourses,
                totalMissedAllCourses,
                hasAttendanceShortage,
                shortageCoursesCount,
                courseAttendanceList,
                totalAssignments,
                submittedCount,
                gradedCount,
                pendingCount,
                lateCount,
                assignmentCompletionRate,
                averageGradePercentage,
                studentAssignments,
                studyMaterialsCount,
                announcementsCount
        );
    }
}
