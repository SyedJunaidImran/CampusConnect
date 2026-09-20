package com.campusconnect.enums;

/**
 * Defines the days of the week for class scheduling.
 * Stored as STRING in the MySQL database via @Enumerated(EnumType.STRING).
 */
public enum DayOfWeek {
    MONDAY,
    TUESDAY,
    WEDNESDAY,
    THURSDAY,
    FRIDAY,
    SATURDAY,
    SUNDAY
}
