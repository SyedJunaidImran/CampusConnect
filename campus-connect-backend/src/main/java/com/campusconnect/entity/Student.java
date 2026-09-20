package com.campusconnect.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Student profile entity — stores student-specific information.
 *
 * RELATIONSHIP: Student has a ONE-TO-ONE relationship with User.
 *   - Every Student row is linked to exactly one User row.
 *   - The User table handles authentication (email, password, role).
 *   - This table holds student-specific data (roll number, semester, etc.).
 *
 * WHY SEPARATE TABLES instead of putting everything in User?
 *   - Faculty and students have completely different profile fields.
 *   - Putting all fields in one table would leave many columns NULL
 *     (e.g., roll_number is NULL for faculty, employee_id is NULL for students).
 *   - Separate tables = cleaner schema, no wasted columns.
 *
 * @JoinColumn(name = "user_id") — creates a column "user_id" in the students table
 * that is a foreign key pointing to the users table's "id" column.
 *
 * CascadeType.ALL — when we delete a Student, its linked User is also deleted.
 * FetchType.EAGER — when we load a Student, its User is loaded immediately
 *                    (not lazily). We almost always need the user data, so EAGER is fine.
 */
@Entity
@Table(name = "students")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "roll_number", nullable = false, unique = true, length = 20)
    private String rollNumber;

    @Column(nullable = false, length = 50)
    private String department;

    @Column(nullable = false)
    private Integer semester;

    @Column(name = "year_of_admission", nullable = false)
    private Integer yearOfAdmission;

    @Column(length = 15)
    private String phone;
}
