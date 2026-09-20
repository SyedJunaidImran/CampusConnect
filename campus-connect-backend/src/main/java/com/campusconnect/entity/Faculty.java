package com.campusconnect.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Faculty profile entity — stores faculty-specific information.
 *
 * Same pattern as Student: one-to-one relationship with User.
 * User handles auth, this table holds faculty-specific fields.
 */
@Entity
@Table(name = "faculty")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Faculty {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "employee_id", nullable = false, unique = true, length = 20)
    private String employeeId;

    @Column(nullable = false, length = 50)
    private String department;

    @Column(length = 50)
    private String designation; // e.g., "Professor", "Assistant Professor"

    @Column(length = 15)
    private String phone;
}
