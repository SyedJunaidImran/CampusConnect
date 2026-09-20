package com.campusconnect.security;

import com.campusconnect.entity.User;
import com.campusconnect.repository.UserRepository;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Collections;

/**
 * Connects Spring Security to our User database table.
 *
 * HOW SPRING SECURITY AUTHENTICATION WORKS:
 * 1. User submits email + password via login form
 * 2. Spring Security calls loadUserByUsername(email) — this method
 * 3. We look up the user in MySQL and return a UserDetails object
 * 4. Spring Security compares the submitted password with the stored hash
 * 5. If they match → authentication success → we generate a JWT token
 * 6. If they don't match → BadCredentialsException → 401 Unauthorized
 *
 * UserDetails is Spring Security's interface for "an authenticated user."
 * We use Spring's built-in User class (not our entity!) that implements UserDetails.
 *
 * AUTHORITIES vs ROLES:
 * Spring Security uses "authorities" for permissions. By convention, roles are
 * prefixed with "ROLE_" (e.g., "ROLE_STUDENT"). This prefix lets us use
 * hasRole("STUDENT") in security config, which auto-adds "ROLE_".
 */
@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    // Constructor injection — Spring automatically injects the UserRepository bean.
    // This is cleaner than @Autowired on a field.
    public CustomUserDetailsService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Load a user from the database by email.
     * Called by Spring Security during authentication.
     *
     * @param email the email submitted in the login request
     * @return UserDetails object that Spring Security uses to verify the password
     * @throws UsernameNotFoundException if no user with that email exists
     */
    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // 1. Find the user in our database
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException(
                        "User not found with email: " + email
                ));

        // 2. Convert our Role enum to Spring Security's GrantedAuthority format
        //    ROLE_STUDENT, ROLE_FACULTY, or ROLE_ADMIN
        Collection<GrantedAuthority> authorities = Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
        );

        // 3. Return Spring Security's UserDetails object
        //    (email as username, hashed password, authorities)
        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                authorities
        );
    }
}
