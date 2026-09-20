package com.campusconnect.config;

import com.campusconnect.entity.*;
import com.campusconnect.enums.AnnouncementPriority;
import com.campusconnect.enums.AnnouncementTarget;
import com.campusconnect.enums.AttendanceStatus;
import com.campusconnect.enums.DayOfWeek;
import com.campusconnect.enums.Role;
import com.campusconnect.enums.SubmissionStatus;
import com.campusconnect.repository.*;

import com.campusconnect.service.FileStorageService;
import org.springframework.boot.CommandLineRunner;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

/**
 * Seeds initial demo data on application startup (Admin, Faculty, Sample Student, Courses,
 * Enrollments, Attendance, Assignments, Submissions, and Timetable Schedules).
 */
@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final FacultyRepository facultyRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final AttendanceRepository attendanceRepository;
    private final AssignmentRepository assignmentRepository;
    private final AssignmentSubmissionRepository assignmentSubmissionRepository;
    private final ClassScheduleRepository classScheduleRepository;
    private final StudyMaterialRepository studyMaterialRepository;
    private final AnnouncementRepository announcementRepository;
    private final FileStorageService fileStorageService;
    private final PasswordEncoder passwordEncoder;

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(DataInitializer.class);

    @org.springframework.beans.factory.annotation.Value("${app.seeder.enabled:false}")
    private boolean seederEnabled;

    @org.springframework.beans.factory.annotation.Value("${app.seeder.admin-password:admin123}")
    private String adminPassword;

    @org.springframework.beans.factory.annotation.Value("${app.seeder.faculty-password:faculty123}")
    private String facultyPassword;

    @org.springframework.beans.factory.annotation.Value("${app.seeder.student-password:student123}")
    private String studentPassword;

    public DataInitializer(UserRepository userRepository,
                           FacultyRepository facultyRepository,
                           StudentRepository studentRepository,
                           CourseRepository courseRepository,
                           EnrollmentRepository enrollmentRepository,
                           AttendanceRepository attendanceRepository,
                           AssignmentRepository assignmentRepository,
                           AssignmentSubmissionRepository assignmentSubmissionRepository,
                           ClassScheduleRepository classScheduleRepository,
                           StudyMaterialRepository studyMaterialRepository,
                           AnnouncementRepository announcementRepository,
                           FileStorageService fileStorageService,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.facultyRepository = facultyRepository;
        this.studentRepository = studentRepository;
        this.courseRepository = courseRepository;
        this.enrollmentRepository = enrollmentRepository;
        this.attendanceRepository = attendanceRepository;
        this.assignmentRepository = assignmentRepository;
        this.assignmentSubmissionRepository = assignmentSubmissionRepository;
        this.classScheduleRepository = classScheduleRepository;
        this.studyMaterialRepository = studyMaterialRepository;
        this.announcementRepository = announcementRepository;
        this.fileStorageService = fileStorageService;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (!seederEnabled) {
            log.info("Database seeder is DISABLED (app.seeder.enabled=false). Skipping demo data initialization.");
            return;
        }

        log.warn("====================================================================");
        log.warn("DEMO DATA SEEDING IS ACTIVE! (app.seeder.enabled=true)");
        log.warn("Notice: Demo accounts are for development testing only.");
        log.warn("====================================================================");

        // 1. Seed Admin
        String adminEmail = "admin@campusconnect.com";
        if (!userRepository.existsByEmail(adminEmail)) {
            User admin = new User();
            admin.setFullName("System Admin");
            admin.setEmail(adminEmail);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setRole(Role.ADMIN);
            userRepository.save(admin);
        }

        // 2. Seed Demo Faculty Member
        String facultyEmail = "faculty@campusconnect.com";
        Faculty sampleFaculty = null;
        if (!userRepository.existsByEmail(facultyEmail)) {
            User facultyUser = new User();
            facultyUser.setFullName("Dr. Robert Smith");
            facultyUser.setEmail(facultyEmail);
            facultyUser.setPassword(passwordEncoder.encode(facultyPassword));
            facultyUser.setRole(Role.FACULTY);

            Faculty faculty = new Faculty();
            faculty.setUser(facultyUser);
            faculty.setEmployeeId("FAC202401");
            faculty.setDepartment("Computer Science");
            faculty.setDesignation("Professor");
            faculty.setPhone("+91 9876543211");

            sampleFaculty = facultyRepository.save(faculty);
        } else {
            sampleFaculty = facultyRepository.findByUserEmail(facultyEmail).orElse(null);
        }

        // 3. Seed Sample Courses
        Course cs101 = seedCourseIfMissing("CS101", "Introduction to Programming", "Fundamentals of programming using Java, variables, loops, arrays and OOP basics.", "Computer Science", 1, 4, sampleFaculty);
        Course cs201 = seedCourseIfMissing("CS201", "Data Structures & Algorithms", "Linear and non-linear data structures, trees, graphs, sorting, searching, and complexity analysis.", "Computer Science", 3, 4, sampleFaculty);
        Course cs301 = seedCourseIfMissing("CS301", "Database Management Systems", "Relational database concepts, SQL, normalization, transactions, indexing and storage engines.", "Computer Science", 5, 3, sampleFaculty);
        Course cs401 = seedCourseIfMissing("CS401", "Operating Systems", "Process management, threads, CPU scheduling, deadlocks, memory management and virtual memory.", "Computer Science", 5, 4, sampleFaculty);
        Course it102 = seedCourseIfMissing("IT102", "Web Technologies", "HTML5, CSS3, modern JavaScript, responsive design, REST APIs, and frontend architectures.", "Information Technology", 2, 3, sampleFaculty);

        // 4. Seed Demo Student
        String studentEmail = "student@campusconnect.com";
        Student sampleStudent = null;
        if (!userRepository.existsByEmail(studentEmail)) {
            User studentUser = new User();
            studentUser.setFullName("Alex Johnson");
            studentUser.setEmail(studentEmail);
            studentUser.setPassword(passwordEncoder.encode(studentPassword));
            studentUser.setRole(Role.STUDENT);

            Student student = new Student();
            student.setUser(studentUser);
            student.setRollNumber("CS2024001");
            student.setDepartment("Computer Science");
            student.setSemester(3);
            student.setYearOfAdmission(2024);
            student.setPhone("+91 9876543210");

            sampleStudent = studentRepository.save(student);
        } else {
            sampleStudent = studentRepository.findByUserEmail(studentEmail).orElse(null);
        }

        // 5. Seed Enrollments for Demo Student
        if (sampleStudent != null) {
            seedEnrollmentIfMissing(sampleStudent, cs101);
            seedEnrollmentIfMissing(sampleStudent, cs201);
            seedEnrollmentIfMissing(sampleStudent, cs301);

            // 6. Seed Sample Attendance Records
            LocalDate today = LocalDate.now();
            seedAttendanceIfMissing(sampleStudent, cs101, today.minusDays(4), AttendanceStatus.PRESENT);
            seedAttendanceIfMissing(sampleStudent, cs101, today.minusDays(3), AttendanceStatus.PRESENT);
            seedAttendanceIfMissing(sampleStudent, cs101, today.minusDays(2), AttendanceStatus.ABSENT);
            seedAttendanceIfMissing(sampleStudent, cs101, today.minusDays(1), AttendanceStatus.PRESENT);

            seedAttendanceIfMissing(sampleStudent, cs201, today.minusDays(3), AttendanceStatus.PRESENT);
            seedAttendanceIfMissing(sampleStudent, cs201, today.minusDays(2), AttendanceStatus.PRESENT);
            seedAttendanceIfMissing(sampleStudent, cs201, today.minusDays(1), AttendanceStatus.PRESENT);

            seedAttendanceIfMissing(sampleStudent, cs301, today.minusDays(2), AttendanceStatus.ABSENT);
            seedAttendanceIfMissing(sampleStudent, cs301, today.minusDays(1), AttendanceStatus.PRESENT);
        }

        // 7. Seed Demo Assignments (Phase 4)
        if (sampleFaculty != null && cs101 != null) {
            Assignment a1 = seedAssignmentIfMissing(
                    "JavaScript Fundamentals",
                    "Write a program demonstrating variables, data types, loops, functions, and DOM manipulation. Include comments explaining each section.",
                    cs101, sampleFaculty,
                    LocalDateTime.now().plusDays(7), 100
            );
            Assignment a2 = seedAssignmentIfMissing(
                    "React Components",
                    "Build a React application with at least 3 reusable components using props, state, and event handlers. Implement a simple to-do list or similar interactive UI.",
                    cs101, sampleFaculty,
                    LocalDateTime.now().plusDays(14), 80
            );
            Assignment a3 = seedAssignmentIfMissing(
                    "Database Design",
                    "Design a normalized relational database schema for an e-commerce platform. Include ER diagrams, table definitions, sample queries, and explain your normalization decisions (1NF through 3NF).",
                    cs101, sampleFaculty,
                    LocalDateTime.now().minusDays(1), 100  // Past due — for testing late submissions
            );

            // Seed demo submissions
            if (sampleStudent != null) {
                // Submitted on time for assignment 1
                if (a1 != null) {
                    seedSubmissionIfMissing(a1, sampleStudent,
                            "Here is my JavaScript fundamentals program covering variables, loops, functions and DOM manipulation with detailed comments.",
                            SubmissionStatus.SUBMITTED, null, null);
                }
                // Graded submission for assignment 3 (the past-due one)
                if (a3 != null) {
                    seedSubmissionIfMissing(a3, sampleStudent,
                            "My database design for an e-commerce platform includes Users, Products, Orders, OrderItems, and Categories tables with proper foreign keys and normalization.",
                            SubmissionStatus.GRADED, 72, "Good schema design. Normalization explanation could be more detailed. Consider adding indexes for frequent queries.");
                }
            }

            // Also seed an assignment for CS201
            if (cs201 != null) {
                seedAssignmentIfMissing(
                        "Sorting Algorithm Analysis",
                        "Implement Merge Sort and Quick Sort. Compare their time complexity with empirical measurements on arrays of size 1000, 10000, and 100000.",
                        cs201, sampleFaculty,
                        LocalDateTime.now().plusDays(10), 75
                );
            }
        }

        // 8. Seed Demo Class Schedules / Timetable (Phase 5)
        if (sampleFaculty != null) {
            if (cs101 != null) {
                seedScheduleIfMissing(cs101, sampleFaculty, DayOfWeek.MONDAY, LocalTime.of(9, 0), LocalTime.of(10, 30), "Room A101", 1, "Computer Science");
                seedScheduleIfMissing(cs101, sampleFaculty, DayOfWeek.WEDNESDAY, LocalTime.of(9, 0), LocalTime.of(10, 30), "Room A101", 1, "Computer Science");
                seedScheduleIfMissing(cs101, sampleFaculty, DayOfWeek.FRIDAY, LocalTime.of(9, 0), LocalTime.of(10, 30), "Lab 1", 1, "Computer Science");
            }
            if (cs201 != null) {
                seedScheduleIfMissing(cs201, sampleFaculty, DayOfWeek.MONDAY, LocalTime.of(11, 0), LocalTime.of(12, 30), "Room B204", 3, "Computer Science");
                seedScheduleIfMissing(cs201, sampleFaculty, DayOfWeek.WEDNESDAY, LocalTime.of(11, 0), LocalTime.of(12, 30), "Room B204", 3, "Computer Science");
                seedScheduleIfMissing(cs201, sampleFaculty, DayOfWeek.THURSDAY, LocalTime.of(14, 0), LocalTime.of(15, 30), "Lab 2", 3, "Computer Science");
            }
            if (cs301 != null) {
                seedScheduleIfMissing(cs301, sampleFaculty, DayOfWeek.TUESDAY, LocalTime.of(10, 0), LocalTime.of(11, 30), "Room C302", 5, "Computer Science");
                seedScheduleIfMissing(cs301, sampleFaculty, DayOfWeek.THURSDAY, LocalTime.of(10, 0), LocalTime.of(11, 30), "Room C302", 5, "Computer Science");
                seedScheduleIfMissing(cs301, sampleFaculty, DayOfWeek.FRIDAY, LocalTime.of(14, 0), LocalTime.of(16, 0), "Database Lab", 5, "Computer Science");
            }
            if (cs401 != null) {
                seedScheduleIfMissing(cs401, sampleFaculty, DayOfWeek.TUESDAY, LocalTime.of(14, 0), LocalTime.of(15, 30), "Room A102", 5, "Computer Science");
                seedScheduleIfMissing(cs401, sampleFaculty, DayOfWeek.THURSDAY, LocalTime.of(16, 0), LocalTime.of(17, 30), "Room A102", 5, "Computer Science");
            }
            if (it102 != null) {
                seedScheduleIfMissing(it102, sampleFaculty, DayOfWeek.MONDAY, LocalTime.of(14, 0), LocalTime.of(15, 30), "Room B205", 2, "Information Technology");
                seedScheduleIfMissing(it102, sampleFaculty, DayOfWeek.WEDNESDAY, LocalTime.of(14, 0), LocalTime.of(15, 30), "Room B205", 2, "Information Technology");
            }

            // 9. Seed Demo Study Materials (Phase 7)
            if (cs101 != null) {
                seedStudyMaterialIfMissing(
                        "CS101 - Lecture 1 & 2: Java Basics & OOP Principles",
                        "Comprehensive lecture notes covering Java data types, variables, classes, inheritance, and polymorphism with annotated code samples.",
                        cs101, sampleFaculty,
                        "CS101_Lecture1_Java_OOP.pdf",
                        "application/pdf",
                        "%PDF-1.4\n% CampusConnect Demo Study Material - CS101 Lecture 1 & 2 Java Basics\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 120 >>\nstream\nBT\n/F1 18 Tf\n50 700 Td\n(CampusConnect - CS101 Java Basics & OOP Principles) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \n0000000201 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n370\n%%EOF".getBytes()
                );
                seedStudyMaterialIfMissing(
                        "CS101 - Lab Exercise Sheet: Loops and Arrays",
                        "Weekly lab practice problems for single-dimensional and 2D arrays, matrix transformations, and loop optimizations.",
                        cs101, sampleFaculty,
                        "CS101_Lab_Exercises.pdf",
                        "application/pdf",
                        "%PDF-1.4\n% CampusConnect Demo Study Material - CS101 Lab Exercises\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 100 >>\nstream\nBT\n/F1 18 Tf\n50 700 Td\n(CS101 Lab Exercises: Loops and Arrays Practice) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \n0000000201 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n350\n%%EOF".getBytes()
                );
            }

            if (cs201 != null) {
                seedStudyMaterialIfMissing(
                        "CS201 - Data Structures: Trees and Graphs Overview",
                        "Detailed slide deck covering Binary Search Trees, AVL Trees, DFS/BFS graph traversals, and Dijkstra algorithm walkthroughs.",
                        cs201, sampleFaculty,
                        "CS201_Trees_and_Graphs_Slides.pdf",
                        "application/pdf",
                        "%PDF-1.4\n% CampusConnect Demo Study Material - CS201 Trees & Graphs\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 110 >>\nstream\nBT\n/F1 18 Tf\n50 700 Td\n(CS201 Data Structures: Binary Trees and Graph Algorithms) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \n0000000201 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n360\n%%EOF".getBytes()
                );
            }

            if (cs301 != null) {
                seedStudyMaterialIfMissing(
                        "CS301 - SQL Querying & Indexing Cheat Sheet",
                        "Quick reference guide for complex JOINs, subqueries, GROUP BY aggregations, window functions, and B-Tree indexing strategies.",
                        cs301, sampleFaculty,
                        "CS301_SQL_CheatSheet.pdf",
                        "application/pdf",
                        "%PDF-1.4\n% CampusConnect Demo Study Material - CS301 SQL Cheat Sheet\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 105 >>\nstream\nBT\n/F1 18 Tf\n50 700 Td\n(CS301 Relational Database Systems & SQL Indexing) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000010 00000 n \n0000000060 00000 n \n0000000117 00000 n \n0000000201 00000 n \ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n355\n%%EOF".getBytes()
                );
            }
        }

        // 9. Seed Announcements
        User adminUser = userRepository.findByEmail("admin@campusconnect.com").orElse(null);
        User facultyUser = userRepository.findByEmail("faculty@campusconnect.com").orElse(null);

        if (adminUser != null) {
            seedAnnouncementIfMissing(
                    "🎉 Welcome to Spring Semester 2026!",
                    "Welcome to the new academic term at CampusConnect! Please review your course schedule, check required textbooks and study materials, and ensure all course registrations are finalized in the portal.",
                    adminUser,
                    AnnouncementTarget.GLOBAL,
                    AnnouncementPriority.IMPORTANT,
                    null
            );

            seedAnnouncementIfMissing(
                    "📅 Midterm Examination Schedule Announcement",
                    "The mid-term examination timetable for all undergraduate and postgraduate engineering courses has been published. Please consult your student portal and timetable tracker for assigned exam halls and seating arrangements.",
                    adminUser,
                    AnnouncementTarget.STUDENT,
                    AnnouncementPriority.URGENT,
                    null
            );

            seedAnnouncementIfMissing(
                    "📋 Faculty Council Meeting & Grade Submission Timeline",
                    "A reminder to all department faculty members: the upcoming academic council meeting is scheduled for Friday at 3:00 PM in Conference Hall B. Please ensure all assignment submissions and daily attendance sheets are updated.",
                    adminUser,
                    AnnouncementTarget.FACULTY,
                    AnnouncementPriority.GENERAL,
                    null
            );
        }

        if (facultyUser != null && cs101 != null) {
            seedAnnouncementIfMissing(
                    "🚀 CS101: Programming Project 1 Guidelines Published",
                    "Dear CS101 students, the project specification for Java Object-Oriented Modeling is now available in the Study Materials section. The submission deadline is in three weeks. Please review the instructions carefully and start early.",
                    facultyUser,
                    AnnouncementTarget.COURSE,
                    AnnouncementPriority.IMPORTANT,
                    cs101
            );
        }
    }

    private void seedAnnouncementIfMissing(String title, String content, User author,
                                          AnnouncementTarget target, AnnouncementPriority priority, Course course) {
        List<Announcement> existing = announcementRepository.findAll();
        for (Announcement a : existing) {
            if (a.getTitle().equals(title)) {
                return;
            }
        }
        Announcement announcement = new Announcement();
        announcement.setTitle(title);
        announcement.setContent(content);
        announcement.setAuthor(author);
        announcement.setTargetAudience(target);
        announcement.setPriority(priority);
        announcement.setCourse(course);
        announcement.setPublished(true);
        announcement.setPublishedAt(LocalDateTime.now().minusDays(1));
        announcementRepository.save(announcement);
    }


    private void seedStudyMaterialIfMissing(String title, String description, Course course, Faculty faculty,
                                            String fileName, String contentType, byte[] fileContent) {
        List<StudyMaterial> existing = studyMaterialRepository.findByCourseId(course.getId());
        for (StudyMaterial m : existing) {
            if (m.getTitle().equals(title)) {
                return;
            }
        }
        String storedFileName = fileStorageService.storeBytes(fileContent, fileName);
        StudyMaterial material = new StudyMaterial();
        material.setTitle(title);
        material.setDescription(description);
        material.setCourse(course);
        material.setFaculty(faculty);
        material.setFileName(fileName);
        material.setStoredFileName(storedFileName);
        material.setFileType(contentType);
        material.setFileSize((long) fileContent.length);
        studyMaterialRepository.save(material);
    }


    private Course seedCourseIfMissing(String code, String name, String desc, String dept, int sem, int credits, Faculty faculty) {
        return courseRepository.findByCourseCode(code).orElseGet(() -> {
            Course c = new Course();
            c.setCourseCode(code);
            c.setCourseName(name);
            c.setDescription(desc);
            c.setDepartment(dept);
            c.setSemester(sem);
            c.setCredits(credits);
            c.setFaculty(faculty);
            return courseRepository.save(c);
        });
    }

    private void seedEnrollmentIfMissing(Student student, Course course) {
        if (course != null && !enrollmentRepository.existsByStudentIdAndCourseId(student.getId(), course.getId())) {
            enrollmentRepository.save(new Enrollment(student, course));
        }
    }

    private void seedAttendanceIfMissing(Student student, Course course, LocalDate date, AttendanceStatus status) {
        if (course != null && !attendanceRepository.existsByStudentIdAndCourseIdAndAttendanceDate(student.getId(), course.getId(), date)) {
            attendanceRepository.save(new Attendance(student, course, date, status));
        }
    }

    private Assignment seedAssignmentIfMissing(String title, String description, Course course, Faculty faculty,
                                               LocalDateTime dueDate, int totalMarks) {
        // Check by title + course to avoid duplicates
        List<Assignment> existing = assignmentRepository.findByCourseId(course.getId());
        for (Assignment a : existing) {
            if (a.getTitle().equals(title)) {
                return a;
            }
        }
        Assignment assignment = new Assignment();
        assignment.setTitle(title);
        assignment.setDescription(description);
        assignment.setCourse(course);
        assignment.setFaculty(faculty);
        assignment.setDueDate(dueDate);
        assignment.setTotalMarks(totalMarks);
        return assignmentRepository.save(assignment);
    }

    private void seedSubmissionIfMissing(Assignment assignment, Student student, String text,
                                         SubmissionStatus status, Integer marks, String feedback) {
        if (!assignmentSubmissionRepository.existsByAssignmentIdAndStudentId(assignment.getId(), student.getId())) {
            AssignmentSubmission sub = new AssignmentSubmission();
            sub.setAssignment(assignment);
            sub.setStudent(student);
            sub.setSubmissionText(text);
            sub.setStatus(status);
            sub.setMarks(marks);
            sub.setFeedback(feedback);
            assignmentSubmissionRepository.save(sub);
        }
    }

    private void seedScheduleIfMissing(Course course, Faculty faculty, DayOfWeek day,
                                       LocalTime startTime, LocalTime endTime,
                                       String room, int semester, String department) {
        List<ClassSchedule> existing = classScheduleRepository.findByDayOfWeekAndCourseId(day, course.getId());
        boolean match = existing.stream().anyMatch(s -> s.getStartTime().equals(startTime) && s.getRoom().equalsIgnoreCase(room));
        if (!match) {
            ClassSchedule schedule = new ClassSchedule();
            schedule.setCourse(course);
            schedule.setFaculty(faculty);
            schedule.setDayOfWeek(day);
            schedule.setStartTime(startTime);
            schedule.setEndTime(endTime);
            schedule.setRoom(room);
            schedule.setSemester(semester);
            schedule.setDepartment(department);
            classScheduleRepository.save(schedule);
        }
    }
}
