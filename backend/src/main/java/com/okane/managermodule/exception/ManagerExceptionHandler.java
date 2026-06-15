package com.okane.managermodule.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.Map;

@ControllerAdvice
public class ManagerExceptionHandler {

    @ExceptionHandler(ManagerNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleManagerNotFound(ManagerNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "NOT_FOUND", "message", ex.getMessage()));
    }

    @ExceptionHandler(ManagerAccessDeniedException.class)
    public ResponseEntity<Map<String, String>> handleManagerAccessDenied(ManagerAccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of("error", "FORBIDDEN", "message", ex.getMessage()));
    }

    @ExceptionHandler(SubAgencyNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleSubAgencyNotFound(SubAgencyNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "NOT_FOUND", "message", ex.getMessage()));
    }
}
