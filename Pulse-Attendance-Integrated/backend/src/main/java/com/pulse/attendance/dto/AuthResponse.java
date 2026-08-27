package com.pulse.attendance.dto;

import com.pulse.attendance.enums.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {
    private String token;
    private String tokenType;
    private String username;
    private String email;
    private String fullName;
    private Role role;
    private Long employeeId;
}
