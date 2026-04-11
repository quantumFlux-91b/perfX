package com.perfx.api.infrastructure.web;

import com.perfx.api.domain.exception.*;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;

/**
 * Centralized exception handler mapping domain exceptions to structured HTTP responses.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(TestRunNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(TestRunNotFoundException ex) {
        return buildResponse(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(UnsupportedToolException.class)
    public ResponseEntity<Map<String, Object>> handleUnsupportedTool(UnsupportedToolException ex) {
        return buildResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(ParseProcessingException.class)
    public ResponseEntity<Map<String, Object>> handleParseError(ParseProcessingException ex) {
        return buildResponse(HttpStatusCode.valueOf(422), ex.getMessage());
    }

    @ExceptionHandler(DuplicateApplicationException.class)
    public ResponseEntity<Map<String, Object>> handleDuplicate(DuplicateApplicationException ex) {
        return buildResponse(HttpStatus.CONFLICT, ex.getMessage());
    }

    private ResponseEntity<Map<String, Object>> buildResponse(HttpStatusCode status, String message) {
        return ResponseEntity.status(status).body(Map.of(
                "status", status.value(),
                "error", HttpStatus.resolve(status.value()) != null
                        ? HttpStatus.resolve(status.value()).getReasonPhrase()
                        : "Unknown",
                "message", message,
                "timestamp", Instant.now().toString()
        ));
    }
}
