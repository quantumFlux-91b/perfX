package com.perfx.api.domain.exception;

/**
 * Base class for all domain-level exceptions.
 * Subclasses map to specific HTTP status codes via {@code GlobalExceptionHandler}.
 */
public abstract class DomainException extends RuntimeException {

    protected DomainException(String message) {
        super(message);
    }

    protected DomainException(String message, Throwable cause) {
        super(message, cause);
    }
}
