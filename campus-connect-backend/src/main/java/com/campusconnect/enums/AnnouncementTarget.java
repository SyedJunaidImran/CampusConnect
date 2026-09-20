package com.campusconnect.enums;

/**
 * Defines the target audience scope for an announcement in CampusConnect.
 *
 * - GLOBAL: Broadcast to all system users (Students, Faculty, and Administrators).
 * - STUDENT: Targeted to all registered students.
 * - FACULTY: Targeted to all faculty members.
 * - ADMIN: Targeted to system administrators.
 * - COURSE: Scoped specifically to students enrolled in and faculty teaching a specific course.
 */
public enum AnnouncementTarget {
    GLOBAL,
    STUDENT,
    FACULTY,
    ADMIN,
    COURSE
}
