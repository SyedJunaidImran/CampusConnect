package com.campusconnect.repository;

import com.campusconnect.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Repository for the User entity — provides database operations.
 *
 * HOW THIS WORKS:
 * By extending JpaRepository<User, Long>, we get ALL of these methods for free:
 *   - save(user)        — INSERT or UPDATE a user
 *   - findById(id)      — SELECT * FROM users WHERE id = ?
 *   - findAll()         — SELECT * FROM users
 *   - deleteById(id)    — DELETE FROM users WHERE id = ?
 *   - count()           — SELECT COUNT(*) FROM users
 *   ... and more.
 *
 * We can also define CUSTOM queries by writing method names that follow Spring's
 * naming convention. Spring Data JPA reads the method name and generates the SQL:
 *
 *   findByEmail("john@example.com")
 *   → translates to: SELECT * FROM users WHERE email = 'john@example.com'
 *
 *   existsByEmail("john@example.com")
 *   → translates to: SELECT COUNT(*) > 0 FROM users WHERE email = 'john@example.com'
 *
 * No SQL writing needed! Spring generates it from the method name.
 *
 * The <User, Long> generic parameters mean:
 *   - User = the entity type this repository manages
 *   - Long = the type of the entity's primary key (@Id field)
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Find a user by their email address.
     * Returns Optional<User> — which is either empty or contains the user.
     * This avoids NullPointerException compared to returning User directly.
     */
    Optional<User> findByEmail(String email);

    /**
     * Check if a user with this email already exists.
     * Used during registration to prevent duplicate accounts.
     */
    boolean existsByEmail(String email);
}
