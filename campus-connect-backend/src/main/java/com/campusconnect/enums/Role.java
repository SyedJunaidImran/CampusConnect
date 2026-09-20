package com.campusconnect.enums;

/**
 * Defines the three user roles in CampusConnect.
 *
 * This enum is stored in the database as a STRING (not a number).
 * For example, a student's row in the 'users' table will have role = "STUDENT",
 * not role = 0. This is configured with @Enumerated(EnumType.STRING) on the entity.
 *
 * Why STRING instead of ORDINAL (number)?
 * - If we used numbers (0, 1, 2) and later added a new role in between,
 *   existing data would silently break. Strings are self-documenting and safe.
 */
public enum Role {
    ADMIN,
    FACULTY,
    STUDENT
}
