package com.campusconnect.entity;

import com.campusconnect.enums.Role;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * The User entity is the core authentication table.
 * Every person in the system (student, faculty, admin) has a row here.
 *
 * This maps to a "users" table in MySQL with columns:
 *   id | email | password | full_name | role | created_at | updated_at
 *
 * --- LOMBOK ANNOTATIONS EXPLAINED ---
 * @Getter     — generates getters for ALL fields (e.g., getEmail(), getRole())
 * @Setter     — generates setters for ALL fields (e.g., setEmail("..."))
 * @NoArgsConstructor — generates an empty constructor: new User()
 *                      Required by JPA — Hibernate needs this to create objects via reflection.
 * @AllArgsConstructor — generates a constructor with ALL fields as parameters.
 *
 * WITHOUT Lombok, you'd have to manually write ~50 lines of getters, setters,
 * and constructors. Lombok generates them at compile time — they exist in the
 * compiled .class file, just not in the source code.
 *
 * --- JPA ANNOTATIONS EXPLAINED ---
 * @Entity — tells JPA "this class maps to a database table"
 * @Table  — customizes the table name (default would be "User", but "users" is cleaner)
 * @Id     — marks the primary key
 * @GeneratedValue(IDENTITY) — auto-increment in MySQL
 * @Column — customizes column properties (nullable, unique, length)
 * @Enumerated(STRING) — store enums as text ("STUDENT") not numbers (2)
 * @CreationTimestamp — Hibernate auto-sets this when the row is first created
 * @UpdateTimestamp   — Hibernate auto-sets this whenever the row is updated
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @Column(nullable = false)
    private String password; // BCrypt hashed — NEVER store or return plain text

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
