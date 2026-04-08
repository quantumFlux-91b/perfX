package com.perfx.api.domain.exception;

import java.util.UUID;

public class TestRunNotFoundException extends DomainException {

    public TestRunNotFoundException(UUID testRunId) {
        super("TestRun not found: " + testRunId);
    }
}
