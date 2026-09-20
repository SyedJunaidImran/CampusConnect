package com.campusconnect.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Global exception handler — catches exceptions from ALL controllers.
 *
 * HOW THIS WORKS:
 * Without this class, unhandled exceptions would return ugly default error pages.
 * @RestControllerAdvice tells Spring: "this class handles exceptions globally."
 * Each @ExceptionHandler method catches a specific exception type and returns
 * a clean JSON error response instead.
 *
 * FLOW:
 * 1. Controller throws ResourceNotFoundException
 * 2. Spring intercepts it BEFORE sending a response
 * 3. Finds the matching @ExceptionHandler method here
 * 4. Calls that method to build the response
 * 5. Sends the clean JSON error to the client
 *
 * This is much better than try-catch in every controller method!
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Handle 404 — resource not found.
     * Triggered when we throw ResourceNotFoundException anywhere in our code.
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorDetails> handleResourceNotFound(ResourceNotFoundException ex) {
        ErrorDetails error = new ErrorDetails(ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.NOT_FOUND);
    }

    /**
     * Handle 409 — duplicate resource (e.g., email already registered).
     */
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorDetails> handleDuplicateResource(DuplicateResourceException ex) {
        ErrorDetails error = new ErrorDetails(ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }

    /**
     * Handle 409 — timetable schedule conflicts (room, faculty, or course overlap).
     */
    @ExceptionHandler(ScheduleConflictException.class)
    public ResponseEntity<ErrorDetails> handleScheduleConflict(ScheduleConflictException ex) {
        ErrorDetails error = new ErrorDetails(ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }

    /**
     * Handle 400 — validation errors.
     * Triggered when @Valid fails on a request DTO (e.g., blank email, short password).
     *
     * Spring collects ALL validation errors into a MethodArgumentNotValidException.
     * We extract each field error and return them as a list.
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorDetails> handleValidationErrors(MethodArgumentNotValidException ex) {
        // Extract error messages from each invalid field
        List<String> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.toList());

        ErrorDetails error = new ErrorDetails("Validation failed", errors);
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle 401 — bad credentials (wrong email or password).
     * Triggered by Spring Security when authentication fails.
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorDetails> handleBadCredentials(BadCredentialsException ex) {
        String msg = (ex.getMessage() != null && !ex.getMessage().equalsIgnoreCase("Bad credentials"))
                ? ex.getMessage()
                : "Invalid email or password";
        ErrorDetails error = new ErrorDetails(msg);
        return new ResponseEntity<>(error, HttpStatus.UNAUTHORIZED);
    }

    /**
     * Handle 403 — authorization denied (e.g., accessing another user's resource).
     */
    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<ErrorDetails> handleSecurityException(SecurityException ex) {
        ErrorDetails error = new ErrorDetails(ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
    }

    /**
     * Handle 403 — Spring Security access denied (e.g., @PreAuthorize checks).
     */
    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ErrorDetails> handleAccessDenied(org.springframework.security.access.AccessDeniedException ex) {
        ErrorDetails error = new ErrorDetails("Access denied: You do not have permission to perform this action.");
        return new ResponseEntity<>(error, HttpStatus.FORBIDDEN);
    }


    /**
     * Handle 400 — illegal argument (e.g., marks exceed total).
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorDetails> handleIllegalArgument(IllegalArgumentException ex) {
        ErrorDetails error = new ErrorDetails(ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle 409 — illegal state (e.g., resubmit after grading).
     */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorDetails> handleIllegalState(IllegalStateException ex) {
        ErrorDetails error = new ErrorDetails(ex.getMessage());
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }

    /**
     * Handle 400 — file upload size exceeded.
     */
    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorDetails> handleMaxUploadSizeExceeded(org.springframework.web.multipart.MaxUploadSizeExceededException ex) {
        ErrorDetails error = new ErrorDetails("File size exceeds the allowable limit (maximum 50MB).");
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle 400 — malformed JSON request body.
     */
    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorDetails> handleHttpMessageNotReadable(org.springframework.http.converter.HttpMessageNotReadableException ex) {
        log.warn("Malformed HTTP request body: {}", ex.getMessage());
        ErrorDetails error = new ErrorDetails("Malformed request payload or invalid data format.");
        return new ResponseEntity<>(error, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle 409 — database integrity constraint violation.
     */
    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<ErrorDetails> handleDataIntegrityViolation(org.springframework.dao.DataIntegrityViolationException ex) {
        log.error("Database integrity constraint violation: {}", ex.getMessage());
        ErrorDetails error = new ErrorDetails("Operation cannot be completed due to a data conflict or database constraint.");
        return new ResponseEntity<>(error, HttpStatus.CONFLICT);
    }

    /**
     * Handle 500 — catch-all for unexpected errors.
     * This is the safety net — if we miss handling a specific exception type,
     * this catches it and returns a generic error instead of a stack trace.
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorDetails> handleGenericException(Exception ex) {
        // Log the full error for debugging with structured logger (the client only sees the safe message)
        log.error("Unhandled exception caught by GlobalExceptionHandler: {}", ex.getMessage(), ex);
        ErrorDetails error = new ErrorDetails("An unexpected error occurred. Please try again.");
        return new ResponseEntity<>(error, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

