package com.perfx.api.application.port.in;

import com.perfx.api.domain.model.TestRun;
import java.io.InputStream;
import java.util.UUID;

public interface UploadTestResultUseCase {
    TestRun upload(UUID userId, String applicationName, String applicationVersion, String runId, String tool, InputStream fileStream);
}
