package com.campusconnect.service;

import com.campusconnect.dto.request.LoginRequest;
import com.campusconnect.dto.request.RegisterStudentRequest;
import com.campusconnect.dto.response.JwtAuthResponse;
import com.campusconnect.dto.response.UserResponse;
import com.campusconnect.entity.Faculty;
import com.campusconnect.entity.Student;
import com.campusconnect.entity.User;
import com.campusconnect.enums.Role;
import com.campusconnect.exception.DuplicateResourceException;
import com.campusconnect.exception.ResourceNotFoundException;
import com.campusconnect.repository.FacultyRepository;
import com.campusconnect.repository.StudentRepository;
import com.campusconnect.repository.UserRepository;
import com.campusconnect.security.JwtTokenProvider;
import com.campusconnect.security.LoginAttemptService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * AuthService — contains the BUSINESS LOGIC for authentication.
 *
 * WHY A SEPARATE SERVICE LAYER?
 * The controller handles HTTP concerns (request/response, status codes).
 * The service handles business logic (validation rules, data transformation).
 * This separation means:
 *   - Business logic can be reused (e.g., called from another service)
 *   - Business logic can be unit tested without HTTP
 *   - Each layer has a single responsibility
 *
 * @Service marks this as a Spring-managed bean. Spring creates one instance
 * and injects it wherever it's needed (like in AuthController).
 *
 * @Transactional on methods means: if anything fails, ALL database changes
 * in that method are rolled back. This prevents partial data (e.g., User created
 * but Student creation failed, leaving an orphan User row).
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final FacultyRepository facultyRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final LoginAttemptService loginAttemptService;

    // Constructor injection — all dependencies are injected by Spring
    public AuthService(UserRepository userRepository,
                       StudentRepository studentRepository,
                       FacultyRepository facultyRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtTokenProvider jwtTokenProvider,
                       LoginAttemptService loginAttemptService) {
        this.userRepository = userRepository;
        this.studentRepository = studentRepository;
        this.facultyRepository = facultyRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.loginAttemptService = loginAttemptService;
    }

    /**
     * Register a new student.
     *
     * FLOW:
     * 1. Check if email or roll number already exists (fail fast)
     * 2. Create a User entity (with hashed password and STUDENT role)
     * 3. Create a Student entity linked to the User
     * 4. Save both to the database
     * 5. Auto-login and return a JWT token
     */
    @Transactional
    public JwtAuthResponse registerStudent(RegisterStudentRequest request) {

        // 1. Check for duplicates
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException(
                    "Email is already registered: " + request.getEmail()
            );
        }
        if (studentRepository.existsByRollNumber(request.getRollNumber())) {
            throw new DuplicateResourceException(
                    "Roll number is already registered: " + request.getRollNumber()
            );
        }

        // 2. Create the User entity
        User user = new User();
        user.setFullName(request.getFullName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword())); // Hash the password!
        user.setRole(Role.STUDENT);

        // 3. Create the Student entity linked to the User
        Student student = new Student();
        student.setUser(user); // This is the one-to-one relationship
        student.setRollNumber(request.getRollNumber());
        student.setDepartment(request.getDepartment());
        student.setSemester(request.getSemester());
        student.setYearOfAdmission(request.getYearOfAdmission());
        student.setPhone(request.getPhone());

        // 4. Save to database
        //    Because Student has CascadeType.ALL, saving the Student
        //    also saves the User automatically. One save call does both!
        studentRepository.save(student);

        // 5. Auto-login: authenticate and generate JWT
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword() // Original password (not hashed)
                )
        );

        String token = jwtTokenProvider.generateToken(authentication);

        return new JwtAuthResponse(token, Role.STUDENT.name(), user.getFullName(), user.getEmail());
    }

    /**
     * Log in an existing user (student, faculty, or admin).
     *
     * FLOW:
     * 1. Spring Security authenticates (checks email exists + password matches)
     * 2. If successful, we generate a JWT token
     * 3. Return the token + user info
     *
     * If authentication fails, Spring Security throws BadCredentialsException,
     * which our GlobalExceptionHandler catches and returns a 401.
     */
    public JwtAuthResponse login(LoginRequest request) {
        String email = request.getEmail() != null ? request.getEmail().trim() : "";

        // Check if user is temporarily locked out due to repeated failed logins
        if (loginAttemptService.isBlocked(email)) {
            int remainingMinutes = loginAttemptService.getRemainingLockMinutes(email);
            throw new BadCredentialsException(
                    "Account is temporarily locked due to multiple failed login attempts. Please try again in " + remainingMinutes + " minute(s)."
            );
        }

        Authentication authentication;
        try {
            // 1. Authenticate — checks email exists + password matches with BCrypt
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            email,
                            request.getPassword()
                    )
            );
            // Reset failed login counter on success
            loginAttemptService.loginSucceeded(email);
        } catch (BadCredentialsException ex) {
            // Register failed attempt
            loginAttemptService.loginFailed(email);
            throw ex;
        }

        // 2. Generate JWT token
        String token = jwtTokenProvider.generateToken(authentication);

        // 3. Load user info for the response
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        return new JwtAuthResponse(token, user.getRole().name(), user.getFullName(), user.getEmail());
    }

    /**
     * Get the current user's profile (for GET /api/auth/me).
     *
     * This is called with the email extracted from the JWT token.
     * We load the User + their role-specific profile (Student or Faculty).
     */
    public UserResponse getCurrentUser(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setEmail(user.getEmail());
        response.setFullName(user.getFullName());
        response.setRole(user.getRole().name());

        // Load role-specific profile data
        if (user.getRole() == Role.STUDENT) {
            studentRepository.findByUserId(user.getId()).ifPresent(student -> {
                response.setRollNumber(student.getRollNumber());
                response.setDepartment(student.getDepartment());
                response.setSemester(student.getSemester());
                response.setYearOfAdmission(student.getYearOfAdmission());
                response.setPhone(student.getPhone());
            });
        } else if (user.getRole() == Role.FACULTY) {
            facultyRepository.findByUserId(user.getId()).ifPresent(faculty -> {
                response.setEmployeeId(faculty.getEmployeeId());
                response.setDepartment(faculty.getDepartment());
                response.setDesignation(faculty.getDesignation());
                response.setPhone(faculty.getPhone());
            });
        }
        // ADMIN users only have the base User fields

        return response;
    }
}
