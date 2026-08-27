package com.pulse.attendance.service;

import com.pulse.attendance.auth.JwtService;
import com.pulse.attendance.dto.AuthResponse;
import com.pulse.attendance.dto.LoginRequest;
import com.pulse.attendance.dto.SignupRequest;
import com.pulse.attendance.entity.AppUser;
import com.pulse.attendance.enums.Role;
import com.pulse.attendance.exception.DuplicateResourceException;
import com.pulse.attendance.exception.ResourceNotFoundException;
import com.pulse.attendance.repository.AppUserRepository;
import com.pulse.attendance.repository.EmployeeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {
    private final AppUserRepository userRepository;
    private final EmployeeRepository employeeRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final com.pulse.attendance.auth.CustomUserDetailsService userDetailsService;
    private final JwtService jwtService;

    public AuthResponse signup(SignupRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateResourceException("Username is already registered");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("Email is already registered");
        }


        AppUser user = new AppUser();
        user.setUsername(request.getUsername().trim());
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setFullName(request.getFullName().trim());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.EMPLOYEE);
        user.setEnabled(true);

        // Link an already-provisioned employee record to the account.
        // This keeps the authenticated user -> employee -> attendance/leave chain intact.
        employeeRepository.findByEmailIgnoreCase(user.getEmail())
                .ifPresent(employee -> user.setEmployeeId(employee.getId()));

        userRepository.save(user);
        return toResponse(user, null);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        AppUser user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Backfill the employee link for existing accounts that were created before
        // employee self-service was introduced.
        if (user.getEmployeeId() == null) {
            employeeRepository.findByEmailIgnoreCase(user.getEmail()).ifPresent(employee -> {
                user.setEmployeeId(employee.getId());
                userRepository.save(user);
            });
        }

        UserDetails details = userDetailsService.loadUserByUsername(user.getUsername());
        String token = jwtService.generateToken(details);
        return toResponse(user, token);
    }

    private AuthResponse toResponse(AppUser user, String token) {
        return new AuthResponse(token, "Bearer", user.getUsername(), user.getEmail(), user.getFullName(), user.getRole(), user.getEmployeeId());
    }
}
