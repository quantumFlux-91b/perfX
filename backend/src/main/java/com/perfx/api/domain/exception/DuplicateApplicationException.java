package com.perfx.api.domain.exception;

public class DuplicateApplicationException extends DomainException {

    public DuplicateApplicationException(String applicationName) {
        super("Application already exists: " + applicationName);
    }
}
