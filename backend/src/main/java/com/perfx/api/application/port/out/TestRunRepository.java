package com.perfx.api.application.port.out;

import com.perfx.api.domain.model.TestRun;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TestRunRepository {
    TestRun save(TestRun testRun);
    Optional<TestRun> findById(UUID id);
    List<TestRun> findByUserIdAndApplicationName(UUID userId, String applicationName);
}
