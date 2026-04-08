package com.perfx.api.domain.exception;

public class UnsupportedToolException extends DomainException {

    public UnsupportedToolException(String tool) {
        super("Unsupported performance testing tool: " + tool);
    }
}
