package com.perfx.api.application.service;

import com.perfx.api.application.port.in.UploadTestResultUseCase;
import com.perfx.api.application.port.out.TestResultParser;
import com.perfx.api.application.port.out.TestRunRepository;
import com.perfx.api.domain.exception.UnsupportedToolException;
import com.perfx.api.domain.model.ParsedMetrics;
import com.perfx.api.domain.model.TestRun;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class UploadService implements UploadTestResultUseCase {

    private final TestRunRepository testRunRepository;
    private final List<TestResultParser> parsers;

    public UploadService(TestRunRepository testRunRepository, List<TestResultParser> parsers) {
        this.testRunRepository = testRunRepository;
        this.parsers = parsers;
    }

    @Override
    public TestRun upload(UUID userId, String applicationName, String applicationVersion,
                          String runId, String tool, InputStream fileStream) {

        TestResultParser parser = parsers.stream()
                .filter(p -> p.supports(tool))
                .findFirst()
                .orElseThrow(() -> new UnsupportedToolException(tool));

        ParsedMetrics parsed = parser.parse(fileStream);

        TestRun testRun = TestRun.builder()
                .userId(userId)
                .applicationName(applicationName)
                .applicationVersion(applicationVersion)
                .runId(runId != null && !runId.isEmpty() ? runId : String.valueOf(Instant.now().toEpochMilli()))
                .uploadTimestamp(Instant.now())
                .metrics(parsed.getAggregateMetrics())
                .timeSeriesMetrics(parsed.getTimeSeriesMetrics())
                .build();

        parsed.getAggregateMetrics().forEach(m -> m.setTestRunId(testRun.getId()));
        parsed.getTimeSeriesMetrics().forEach(m -> m.setTestRunId(testRun.getId()));

        return testRunRepository.save(testRun);
    }
}
