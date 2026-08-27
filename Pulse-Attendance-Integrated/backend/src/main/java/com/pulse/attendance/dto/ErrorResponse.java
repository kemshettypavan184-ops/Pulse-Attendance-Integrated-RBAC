package com.pulse.attendance.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class ErrorResponse {
    private boolean success;
    private String message;
    private Object data;
    private int status;
    private String error;
    private String path;
    private LocalDateTime timestamp;
}
