package com.campusconnect.enums;

/**
 * Defines the status of an assignment submission.
 * Stored as STRING in the MySQL database.
 */
public enum SubmissionStatus {
    NOT_SUBMITTED,
    SUBMITTED,
    GRADED,
    LATE
}
