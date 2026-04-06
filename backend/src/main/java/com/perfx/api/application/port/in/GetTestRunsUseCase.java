package com.perfx.api.application.port.in;

import com.perfx.api.domain.model.TestRun;
import java.util.List;
import java.util.UUID;

public interface GetTestRunsUseCase {
    List<TestRun> getRecentRuns(UUID userId, String applicationName);
    TestRun getRunDetails(UUID testRunId);
}
