package com.perfx.api.application.service;

import com.perfx.api.application.port.in.GetTestRunsUseCase;
import com.perfx.api.application.port.out.TestRunRepository;
import com.perfx.api.domain.exception.TestRunNotFoundException;
import com.perfx.api.domain.model.TestRun;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class QueryService implements GetTestRunsUseCase {

    private final TestRunRepository testRunRepository;

    public QueryService(TestRunRepository testRunRepository) {
        this.testRunRepository = testRunRepository;
    }

    @Override
    public List<TestRun> getRecentRuns(UUID userId, String applicationName) {
        return testRunRepository.findByUserIdAndApplicationName(userId, applicationName);
    }

    @Override
    public TestRun getRunDetails(UUID testRunId) {
        return testRunRepository.findById(testRunId)
                .orElseThrow(() -> new TestRunNotFoundException(testRunId));
    }
}
